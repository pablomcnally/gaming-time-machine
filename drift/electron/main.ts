import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  powerSaveBlocker,
  shell,
  Tray,
} from 'electron';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { basename, dirname, extname, join } from 'node:path';
import { promisify } from 'node:util';

const APP_NAME = 'DRIFT';
const execFileAsync = promisify(execFile);
const PHRASE_SCRIPT_TEMPLATE = `# DRIFT Custom Phrase Script
# One phrase per line. Empty lines and lines beginning with # are ignored.
#
# Optional tags can be combined:
#   [chatter] Route this line to Radio Chatter instead of Announcements.
#   [low] Play this line as a lower, slower voice.
#   [voice=Hazel] Prefer an installed Windows voice whose name contains Hazel.
#
# After editing, save this file and press RELOAD PHRASES inside DRIFT.

[low] Attention. Atmospheric conditions are changing beyond the eastern platform.
`;

// Electron/Chromium GPU caches can leave a permanently black compositor surface after a
// force-terminated portable session on some Windows drivers. DRIFT's visual layer is modest,
// so software compositing is the safer default and does not affect the Web Audio engine.
app.disableHardwareAcceleration();
if (process.env.DRIFT_QA === '1') {
  app.setPath('userData', join(app.getPath('temp'), 'DRIFT-QA-Profile'));
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let trayEnabled = false;
let isQuitting = false;
let powerBlockerId: number | null = null;

function statePath(): string {
  return join(app.getPath('userData'), 'drift-state.json');
}

function importedAudioPath(fileName?: string): string {
  const directory = join(app.getPath('userData'), 'imported-audio');
  if (!fileName) return directory;
  if (
    basename(fileName) !== fileName ||
    !/^[a-f0-9-]{36}\.(wav|mp3|ogg|m4a|aac|flac)$/i.test(fileName)
  ) {
    throw new Error('Invalid managed audio filename.');
  }
  return join(directory, fileName);
}

function phraseScriptPath(): string {
  return join(app.getPath('userData'), 'custom-phrases.txt');
}

function customSpeechPath(fileName?: string): string {
  const directory = join(app.getPath('userData'), 'custom-speech');
  if (!fileName) return directory;
  if (basename(fileName) !== fileName || !/^[a-f0-9]{24}\.wav$/i.test(fileName)) {
    throw new Error('Invalid custom speech filename.');
  }
  return join(directory, fileName);
}

function atomicWrite(path: string, content: string | Buffer): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, content);
  renameSync(temporary, path);
}

function ensurePhraseScript(): string {
  const path = phraseScriptPath();
  if (!existsSync(path)) atomicWrite(path, PHRASE_SCRIPT_TEMPLATE);
  return path;
}

interface ParsedPhrase {
  id: string;
  text: string;
  kind: 'chatter' | 'transmission';
  lowVoice: boolean;
  voice: string;
  fileName: string;
}

function parsePhraseLine(source: string): ParsedPhrase | null {
  let remainder = source.trim();
  if (!remainder || remainder.startsWith('#')) return null;
  let kind: ParsedPhrase['kind'] = 'transmission';
  let lowVoice = false;
  let voice = '';
  while (remainder.startsWith('[')) {
    const match = remainder.match(/^\[([^\]]+)\]\s*/);
    if (!match) break;
    const tag = match[1]!.trim();
    if (tag.toLowerCase() === 'chatter') kind = 'chatter';
    else if (tag.toLowerCase() === 'announcement') kind = 'transmission';
    else if (tag.toLowerCase() === 'low') lowVoice = true;
    else if (tag.toLowerCase().startsWith('voice=')) voice = tag.slice(6).trim().slice(0, 64);
    remainder = remainder.slice(match[0].length);
  }
  const text = remainder.trim().slice(0, 240);
  if (!text) return null;
  const id = createHash('sha256')
    .update(JSON.stringify({ text, kind, lowVoice, voice }))
    .digest('hex')
    .slice(0, 24);
  return { id, text, kind, lowVoice, voice, fileName: `${id}.wav` };
}

async function renderPhrase(phrase: ParsedPhrase): Promise<void> {
  const destination = customSpeechPath(phrase.fileName);
  if (
    existsSync(destination) &&
    statSync(destination).size > 44 &&
    readFileSync(destination).subarray(0, 4).toString('ascii') === 'RIFF'
  ) {
    return;
  }
  mkdirSync(customSpeechPath(), { recursive: true });
  const temporary = `${destination}.tmp.wav`;
  if (existsSync(temporary)) unlinkSync(temporary);
  const command = `
$ErrorActionPreference = 'Stop'
$speaker = New-Object -ComObject SAPI.SpVoice
$stream = New-Object -ComObject SAPI.SpFileStream
try {
  if ($env:DRIFT_SPEECH_VOICE) {
    $token = @($speaker.GetVoices()) |
      Where-Object { $_.GetDescription() -like ('*' + $env:DRIFT_SPEECH_VOICE + '*') } |
      Select-Object -First 1
    if ($token) { $speaker.Voice = $token }
  }
  $stream.Open($env:DRIFT_SPEECH_OUTPUT, 3, $false)
  $speaker.AudioOutputStream = $stream
  $speaker.Rate = 0
  $speaker.Volume = 100
  [void]$speaker.Speak($env:DRIFT_SPEECH_TEXT)
} finally {
  try { $stream.Close() } catch {}
}
`;
  await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
    timeout: 30000,
    windowsHide: true,
    env: {
      ...process.env,
      DRIFT_SPEECH_TEXT: phrase.text,
      DRIFT_SPEECH_OUTPUT: temporary,
      DRIFT_SPEECH_VOICE: phrase.voice,
    },
  });
  if (
    !existsSync(temporary) ||
    statSync(temporary).size <= 44 ||
    readFileSync(temporary).subarray(0, 4).toString('ascii') !== 'RIFF'
  ) {
    throw new Error(`Windows could not render "${phrase.text.slice(0, 32)}".`);
  }
  if (existsSync(destination)) unlinkSync(destination);
  renameSync(temporary, destination);
}

function sendAction(action: string): void {
  mainWindow?.webContents.send('tray:action', action);
}

function trayImage(): Electron.NativeImage {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="7" fill="#111715"/>
      <circle cx="16" cy="16" r="11" fill="none" stroke="#c9a96e" stroke-width="2"/>
      <path d="M9 18c4-8 10 8 14-1" fill="none" stroke="#e8e0cf" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  return nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
  );
}

function createTray(): void {
  if (tray || !trayEnabled) return;
  tray = new Tray(trayImage().resize({ width: 16, height: 16 }));
  tray.setToolTip(`${APP_NAME} — generative drone synthesizer`);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Mute / unmute', click: () => sendAction('toggle-mute') },
      { label: 'Freeze / unfreeze', click: () => sendAction('toggle-freeze') },
      { type: 'separator' },
      { label: 'Previous preset', click: () => sendAction('previous-preset') },
      { label: 'Next preset', click: () => sendAction('next-preset') },
      { label: 'Mutate', click: () => sendAction('mutate') },
      { type: 'separator' },
      {
        label: 'Restore DRIFT',
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function destroyTray(): void {
  tray?.destroy();
  tray = null;
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1080,
    minHeight: 700,
    show: false,
    backgroundColor: '#0b0e0d',
    title: APP_NAME,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  const showWhenReady = () => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) mainWindow.show();
  };
  mainWindow.once('ready-to-show', showWhenReady);
  mainWindow.webContents.once('did-finish-load', showWhenReady);

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void mainWindow.loadURL(devUrl);
  } else {
    void mainWindow.loadFile(join(__dirname, '..', 'dist', 'index.html'));
  }
  setTimeout(showWhenReady, 1200);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.on('close', (event) => {
    if (!isQuitting && trayEnabled) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('state:load', () => {
  try {
    const path = statePath();
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (error) {
    dialog.showErrorBox(APP_NAME, `Saved state could not be read.\n\n${String(error)}`);
    return null;
  }
});

ipcMain.handle('state:save', (_event, state: unknown) => {
  try {
    atomicWrite(statePath(), JSON.stringify(state, null, 2));
    return true;
  } catch (error) {
    dialog.showErrorBox(APP_NAME, `State could not be saved.\n\n${String(error)}`);
    return false;
  }
});

ipcMain.handle('preset:export', async (_event, preset: unknown, suggestedName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Export DRIFT preset',
    defaultPath: `${suggestedName.replace(/[<>:"/\\|?*]+/g, '-')}.drift.json`,
    filters: [{ name: 'DRIFT Preset', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return false;
  atomicWrite(result.filePath, JSON.stringify(preset, null, 2));
  return true;
});

ipcMain.handle('preset:import', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Import DRIFT preset',
    properties: ['openFile'],
    filters: [{ name: 'DRIFT Preset', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  try {
    return JSON.parse(readFileSync(result.filePaths[0], 'utf8')) as unknown;
  } catch (error) {
    dialog.showErrorBox(APP_NAME, `Preset could not be imported.\n\n${String(error)}`);
    return null;
  }
});

ipcMain.handle('audio:import', async () => {
  const qaFixture = process.env.DRIFT_QA_AUDIO_FIXTURE;
  let selectedPaths: string[] = [];
  if (process.env.DRIFT_QA === '1' && qaFixture && existsSync(qaFixture)) {
    selectedPaths = [qaFixture];
  } else {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Import sounds into DRIFT',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Audio',
          extensions: ['wav', 'mp3', 'ogg', 'm4a', 'aac', 'flac'],
        },
      ],
    });
    if (result.canceled) return [];
    selectedPaths = result.filePaths;
  }

  const imported: Array<{ id: string; name: string; fileName: string; size: number }> = [];
  const supported = new Set(['.wav', '.mp3', '.ogg', '.m4a', '.aac', '.flac']);
  mkdirSync(importedAudioPath(), { recursive: true });
  for (const sourcePath of selectedPaths.slice(0, 8)) {
    try {
      const extension = extname(sourcePath).toLowerCase();
      const size = statSync(sourcePath).size;
      if (!supported.has(extension) || size <= 0 || size > 100 * 1024 * 1024) continue;
      const id = randomUUID();
      const fileName = `${id}${extension}`;
      copyFileSync(sourcePath, importedAudioPath(fileName));
      imported.push({
        id,
        name: basename(sourcePath, extension).slice(0, 64),
        fileName,
        size,
      });
    } catch {
      // A bad file should not prevent other selected sounds from joining the library.
    }
  }
  if (!imported.length && selectedPaths.length) {
    dialog.showErrorBox(
      APP_NAME,
      'No sounds were imported. Choose a supported audio file smaller than 100 MB.',
    );
  }
  return imported;
});

ipcMain.handle('audio:load', (_event, fileName: string) => {
  try {
    const path = importedAudioPath(fileName);
    if (!existsSync(path)) return null;
    const bytes = readFileSync(path);
    if (bytes.length <= 0 || bytes.length > 100 * 1024 * 1024) return null;
    return new Uint8Array(bytes);
  } catch {
    return null;
  }
});

ipcMain.handle('audio:remove', (_event, fileName: string) => {
  try {
    const path = importedAudioPath(fileName);
    if (existsSync(path)) unlinkSync(path);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('speech:open-script', async () => {
  try {
    const path = ensurePhraseScript();
    const error = await shell.openPath(path);
    return { path, error };
  } catch (error) {
    return { path: phraseScriptPath(), error: String(error) };
  }
});

ipcMain.handle('speech:reload', async () => {
  const path = ensurePhraseScript();
  try {
    const phrases = readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map(parsePhraseLine)
      .filter((phrase): phrase is ParsedPhrase => Boolean(phrase))
      .slice(0, 32);
    const clips: Array<{
      id: string;
      text: string;
      kind: ParsedPhrase['kind'];
      lowVoice: boolean;
      bytes: Uint8Array;
    }> = [];
    let failed = 0;
    for (const phrase of phrases) {
      try {
        await renderPhrase(phrase);
        const bytes = readFileSync(customSpeechPath(phrase.fileName));
        clips.push({
          id: phrase.id,
          text: phrase.text,
          kind: phrase.kind,
          lowVoice: phrase.lowVoice,
          bytes: new Uint8Array(bytes),
        });
      } catch {
        failed += 1;
      }
    }
    return { path, clips, failed };
  } catch {
    return { path, clips: [], failed: 1 };
  }
});

ipcMain.handle(
  'recording:save',
  async (
    _event,
    bytes: Uint8Array,
    suggestedName: string,
    recordingLocation?: string,
  ): Promise<string | null> => {
    const safeName = suggestedName.replace(/[<>:"/\\|?*]+/g, '-');
    const initialFolder =
      recordingLocation && existsSync(recordingLocation) ? recordingLocation : app.getPath('music');
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Save DRIFT recording',
      defaultPath: join(initialFolder, `${safeName}.wav`),
      filters: [{ name: 'WAV Audio', extensions: ['wav'] }],
    });
    if (result.canceled || !result.filePath) return null;
    atomicWrite(result.filePath, Buffer.from(bytes));
    return result.filePath;
  },
);

ipcMain.handle('directory:choose', async (_event, kind: 'preset' | 'recording') => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: `Choose ${kind} storage folder`,
    properties: ['openDirectory', 'createDirectory'],
  });
  return result.canceled ? null : (result.filePaths[0] ?? null);
});

ipcMain.handle('tray:set-enabled', (_event, enabled: boolean) => {
  trayEnabled = Boolean(enabled);
  if (trayEnabled) createTray();
  else destroyTray();
  return trayEnabled;
});

ipcMain.handle('power:set-active', (_event, active: boolean) => {
  if (active && powerBlockerId === null) {
    powerBlockerId = powerSaveBlocker.start('prevent-app-suspension');
  } else if (!active && powerBlockerId !== null && powerSaveBlocker.isStarted(powerBlockerId)) {
    powerSaveBlocker.stop(powerBlockerId);
    powerBlockerId = null;
  }
  return powerBlockerId !== null;
});

const singleInstance = process.env.DRIFT_QA === '1' || app.requestSingleInstanceLock();
if (!singleInstance) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app.whenReady().then(() => {
    app.setName(APP_NAME);
    createWindow();
    createTray();
    app.on('activate', () => {
      if (mainWindow) mainWindow.show();
      else createWindow();
    });
  });
}

app.on('before-quit', () => {
  isQuitting = true;
  if (powerBlockerId !== null && powerSaveBlocker.isStarted(powerBlockerId)) {
    powerSaveBlocker.stop(powerBlockerId);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !trayEnabled) app.quit();
});
