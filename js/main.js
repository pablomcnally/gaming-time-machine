const WIDTH = 480;
const HEIGHT = 800;

const GAME_STATE = {
  TITLE: "title",
  PLAYING: "playing",
  GAME_OVER: "gameover",
  WIN: "win",
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const distanceSquared = (ax, ay, bx, by) => {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
};

class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();

    window.addEventListener("keydown", (event) => {
      const code = event.code;
      const tracked = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "Space",
        "Enter",
      ];

      if (tracked.includes(code)) {
        event.preventDefault();
      }

      if (!this.keys.has(code)) {
        this.pressed.add(code);
      }
      this.keys.add(code);
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });
  }

  isDown(...codes) {
    return codes.some((code) => this.keys.has(code));
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  endFrame() {
    this.pressed.clear();
  }
}

class Bullet {
  constructor({ x, y, vx, vy, radius, damage, friendly, color, life = 8 }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.damage = damage;
    this.friendly = friendly;
    this.color = color;
    this.life = life;
    this.dead = false;
    this.trail = friendly ? "#d8f6ff" : "#ffd4ba";
  }


  pickVariant() {
    if (this.type === "basic") {
      return Math.random() < 0.5 ? "jet" : "scout";
    }
    if (this.type === "heavy") {
      return Math.random() < 0.5 ? "gunship" : "bomber";
    }
    return Math.random() < 0.5 ? "helicopter" : "attack-jet";
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;

    if (
      this.life <= 0 ||
      this.x < -40 ||
      this.x > WIDTH + 40 ||
      this.y < -60 ||
      this.y > HEIGHT + 60
    ) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.friendly ? 0.35 : 0.28;
    ctx.strokeStyle = this.trail;
    ctx.lineWidth = this.radius * 1.4;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + (this.friendly ? 16 : -10));
    ctx.lineTo(this.x, this.y - (this.friendly ? 8 : -18));
    ctx.stroke();

    const gradient = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.radius * 2.4);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.4, this.color);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Particle {
  constructor({ x, y, vx, vy, size, color, life }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.dead = false;
  }


  pickVariant() {
    if (this.type === "basic") {
      return Math.random() < 0.5 ? "jet" : "scout";
    }
    if (this.type === "heavy") {
      return Math.random() < 0.5 ? "gunship" : "bomber";
    }
    return Math.random() < 0.5 ? "helicopter" : "attack-jet";
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.vx *= 0.985;
    this.vy *= 0.985;
    if (this.life <= 0) {
      this.dead = true;
    }
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

class FloatingText {
  constructor(x, y, text, color = "#fff79a") {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 0.8;
    this.dead = false;
  }


  pickVariant() {
    if (this.type === "basic") {
      return Math.random() < 0.5 ? "jet" : "scout";
    }
    if (this.type === "heavy") {
      return Math.random() < 0.5 ? "gunship" : "bomber";
    }
    return Math.random() < 0.5 ? "helicopter" : "attack-jet";
  }

  update(dt) {
    this.y -= 24 * dt;
    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.globalAlpha = clamp(this.life / 0.8, 0, 1);
    ctx.fillStyle = this.color;
    ctx.font = "bold 16px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.vy = 110;
    this.dead = false;
    this.angle = Math.random() * Math.PI * 2;
    this.pulse = Math.random() * Math.PI * 2;
  }


  pickVariant() {
    if (this.type === "basic") {
      return Math.random() < 0.5 ? "jet" : "scout";
    }
    if (this.type === "heavy") {
      return Math.random() < 0.5 ? "gunship" : "bomber";
    }
    return Math.random() < 0.5 ? "helicopter" : "attack-jet";
  }

  update(dt) {
    this.y += this.vy * dt;
    this.x += Math.sin(this.angle) * 16 * dt;
    this.angle += dt * 3;
    this.pulse += dt * 5;
    if (this.y > HEIGHT + 40) {
      this.dead = true;
    }
  }

  draw(ctx) {
    const glowSize = 22 + Math.sin(this.pulse) * 2;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const gradient = ctx.createRadialGradient(0, 0, 1, 0, 0, glowSize);
    gradient.addColorStop(0, "#fffde4");
    gradient.addColorStop(0.35, "#9bff8f");
    gradient.addColorStop(0.7, "rgba(74, 220, 98, 0.65)");
    gradient.addColorStop(1, "rgba(74,220,98,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(18, 43, 22, 0.92)";
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(16, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(-16, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#e7ffd5";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.rotate(-this.angle);
    ctx.fillStyle = "#efffe9";
    ctx.font = "bold 12px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("P", 0, 4);
    ctx.restore();
  }
}

class Medal {
  constructor(x, y, value = 500) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 12;
    this.vy = 120;
    this.vx = (Math.random() - 0.5) * 40;
    this.dead = false;
    this.spin = Math.random() * Math.PI * 2;
  }


  pickVariant() {
    if (this.type === "basic") {
      return Math.random() < 0.5 ? "jet" : "scout";
    }
    if (this.type === "heavy") {
      return Math.random() < 0.5 ? "gunship" : "bomber";
    }
    return Math.random() < 0.5 ? "helicopter" : "attack-jet";
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.spin += dt * 4;
    if (this.y > HEIGHT + 40) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1, 0.82 + Math.sin(this.spin) * 0.18);
    const gradient = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
    gradient.addColorStop(0, "#fff7cc");
    gradient.addColorStop(0.45, "#ffd86f");
    gradient.addColorStop(1, "rgba(255,216,111,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c59118";
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff2b3";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

class Player {
  constructor(game) {
    this.game = game;
    this.radius = 18;
    this.reset();
  }

  reset() {
    this.x = WIDTH / 2;
    this.y = HEIGHT - 110;
    this.speed = 300;
    this.fireCooldown = 0;
    this.fireDelay = 0.1;
    this.weaponLevel = 1;
    this.lives = 3;
    this.invulnerability = 0;
    this.respawnTimer = 0;
    this.hitFlash = 0;
  }

  update(dt, input) {
    if (this.respawnTimer > 0) {
      this.respawnTimer -= dt;
    }

    let moveX = 0;
    let moveY = 0;
    if (input.isDown("ArrowLeft", "KeyA")) {
      moveX -= 1;
    }
    if (input.isDown("ArrowRight", "KeyD")) {
      moveX += 1;
    }
    if (input.isDown("ArrowUp", "KeyW")) {
      moveY -= 1;
    }
    if (input.isDown("ArrowDown", "KeyS")) {
      moveY += 1;
    }

    if (moveX !== 0 || moveY !== 0) {
      const length = Math.hypot(moveX, moveY);
      moveX /= length;
      moveY /= length;
    }

    this.x = clamp(this.x + moveX * this.speed * dt, 30, WIDTH - 30);
    this.y = clamp(this.y + moveY * this.speed * dt, 40, HEIGHT - 40);

    this.fireCooldown -= dt;
    this.invulnerability = Math.max(0, this.invulnerability - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4.5);

    if (input.isDown("Space") && this.fireCooldown <= 0) {
      this.fire();
      this.fireCooldown = this.fireDelay;
      this.game.createBurst(this.x, this.y - 26, "#aeeeff", 2, 24);
    }
  }

  fire() {
    const bulletSpeed = -620;
    const configByLevel = {
      1: [
        { offsetX: 0, vx: 0, damage: 1, radius: 4, color: "#9fe8ff", trail: "#d8f6ff" },
      ],
      2: [
        { offsetX: -10, vx: -28, damage: 1, radius: 4, color: "#7dffcb", trail: "#b5ffe8" },
        { offsetX: 10, vx: 28, damage: 1, radius: 4, color: "#7dffcb", trail: "#b5ffe8" },
      ],
      3: [
        { offsetX: -14, vx: -105, damage: 1, radius: 4, color: "#ffd85e", trail: "#fff0b6" },
        { offsetX: 0, vx: 0, damage: 2, radius: 5, color: "#ff9d5e", trail: "#ffd8af" },
        { offsetX: 14, vx: 105, damage: 1, radius: 4, color: "#ffd85e", trail: "#fff0b6" },
      ],
    };

    for (const shot of configByLevel[this.weaponLevel]) {
      this.game.playerBullets.push(
        new Bullet({
          x: this.x + shot.offsetX,
          y: this.y - 28,
          vx: shot.vx,
          vy: bulletSpeed,
          radius: shot.radius,
          damage: shot.damage,
          friendly: true,
          color: shot.color,
          trail: shot.trail,
        }),
      );
    }
  }

  hit() {
    if (this.invulnerability > 0 || this.respawnTimer > 0) {
      return;
    }

    this.lives -= 1;
    this.invulnerability = 2.4;
    this.respawnTimer = 0.55;
    this.hitFlash = 1;
    this.game.shake = Math.max(this.game.shake, 10);
    this.game.flash = Math.max(this.game.flash, 0.32);
    this.game.createExplosion(this.x, this.y, "#ffb57a", 20, 240);

    if (this.lives <= 0) {
      this.game.state = GAME_STATE.GAME_OVER;
    }
  }

  collectPowerUp() {
    this.weaponLevel = clamp(this.weaponLevel + 1, 1, 3);
    this.game.floatingTexts.push(new FloatingText(this.x, this.y - 20, `WEAPON ${this.weaponLevel}`, "#bfffb3", 1));
    this.game.createBurst(this.x, this.y, "#8cff9c", 16, 78);
  }

  draw(ctx) {
    if (this.respawnTimer > 0 && Math.floor(this.respawnTimer * 20) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    const hull = ctx.createLinearGradient(0, -24, 0, 24);
    hull.addColorStop(0, "#f5fbff");
    hull.addColorStop(0.55, "#56c6ff");
    hull.addColorStop(1, "#2459b5");

    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(18, 18);
    ctx.lineTo(6, 12);
    ctx.lineTo(0, 28);
    ctx.lineTo(-6, 12);
    ctx.lineTo(-18, 18);
    ctx.closePath();
    ctx.fill();

    if (this.hitFlash > 0) {
      ctx.globalAlpha = this.hitFlash * 0.6;
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (this.weaponLevel >= 2) {
      ctx.fillStyle = this.weaponLevel === 2 ? "#5dffb8" : "#ffd96e";
      ctx.fillRect(-20, 0, 8, 18);
      ctx.fillRect(12, 0, 8, 18);
    }

    if (this.weaponLevel === 3) {
      ctx.fillStyle = "#ff8e58";
      ctx.fillRect(-24, 12, 6, 10);
      ctx.fillRect(18, 12, 6, 10);
    }

    ctx.fillStyle = "#ff8d50";
    ctx.fillRect(-9, 18, 6, 16);
    ctx.fillRect(3, 18, 6, 16);

    ctx.fillStyle = "#ffe88d";
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 10);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();

    if (this.invulnerability > 0) {
      ctx.strokeStyle = "rgba(173, 236, 255, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

class Enemy {
  constructor(game, type, x, y, options = {}) {
    this.game = game;
    this.type = type;
    this.x = x;
    this.y = y;
    this.age = 0;
    this.dead = false;
    this.radius = options.radius !== undefined ? options.radius : 18;
    this.hp = options.hp !== undefined ? options.hp : 2;
    this.maxHp = this.hp;
    this.speed = options.speed !== undefined ? options.speed : 120;
    this.scoreValue = options.scoreValue !== undefined ? options.scoreValue : 100;
    this.pattern = options.pattern !== undefined ? options.pattern : "straight";
    this.phase = options.phase !== undefined ? options.phase : Math.random() * Math.PI * 2;
    this.fireCooldown = options.fireDelay !== undefined ? options.fireDelay : 1.5 + Math.random() * 0.8;
    this.color = options.color !== undefined ? options.color : "#ff7676";
    this.dropChance = options.dropChance !== undefined ? options.dropChance : 0;
    this.medalChance = options.medalChance !== undefined ? options.medalChance : 0;
    this.variant = options.variant !== undefined ? options.variant : this.pickVariant();
    this.hitFlash = 0;
  }


  pickVariant() {
    if (this.type === "basic") {
      return Math.random() < 0.5 ? "jet" : "scout";
    }
    if (this.type === "heavy") {
      return Math.random() < 0.5 ? "gunship" : "bomber";
    }
    return Math.random() < 0.5 ? "helicopter" : "attack-jet";
  }

  update(dt) {
    this.age += dt;
    this.fireCooldown -= dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 5);

    switch (this.pattern) {
      case "sine":
        this.y += this.speed * dt;
        this.x += Math.sin(this.age * 2.6 + this.phase) * 90 * dt;
        break;
      case "drift":
        this.y += this.speed * dt;
        this.x += Math.cos(this.age * 1.8 + this.phase) * 38 * dt;
        break;
      default:
        this.y += this.speed * dt;
        break;
    }

    if (this.type === "turret" && this.fireCooldown <= 0) {
      this.fire();
      this.fireCooldown = 1.6;
    }

    if (this.y > HEIGHT + 60 || this.x < -80 || this.x > WIDTH + 80) {
      this.dead = true;
    }
  }

  fire() {
    const player = this.game.player;
    const aimX = player.x - this.x;
    const aimY = player.y - this.y;
    const aimLength = Math.max(1, Math.hypot(aimX, aimY));
    const dirX = aimX / aimLength;
    const dirY = aimY / aimLength;
    const speed = 200;

    for (const angleOffset of [-0.25, 0, 0.25]) {
      const cos = Math.cos(angleOffset);
      const sin = Math.sin(angleOffset);
      const vx = (dirX * cos - dirY * sin) * speed;
      const vy = (dirX * sin + dirY * cos) * speed;
      this.game.enemyBullets.push(
        new Bullet({
          x: this.x,
          y: this.y + 14,
          vx,
          vy,
          radius: 5,
          damage: 1,
          friendly: false,
          color: "#ff7d6e",
        }),
      );
    }
  }

  damage(amount) {
    this.hp -= amount;
    this.hitFlash = 1;
    this.game.shake = Math.max(this.game.shake, 2.6);
    this.game.createBurst(this.x, this.y, "#ffd091", 8, 36);

    if (this.hp <= 0) {
      this.dead = true;
      this.game.score += this.scoreValue;
      const explosionCount = this.type === "heavy" ? 28 : this.type === "turret" ? 22 : 18;
      const explosionForce = this.type === "heavy" ? 310 : this.type === "turret" ? 260 : 210;
      this.game.shake = Math.max(this.game.shake, this.type === "heavy" ? 7 : 5);
      this.game.flash = Math.max(this.game.flash, this.type === "heavy" ? 0.18 : 0.12);
      this.game.createExplosion(this.x, this.y, this.color, explosionCount, explosionForce);
      if (Math.random() < this.dropChance) {
        this.game.powerUps.push(new PowerUp(this.x, this.y));
        this.game.floatingTexts.push(new FloatingText(this.x, this.y - 16, "POWER", "#b6ffad", 0.7));
      }
      if (Math.random() < this.medalChance) {
        this.game.medals.push(new Medal(this.x + (Math.random() - 0.5) * 16, this.y));
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.variant === "jet") {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(18, -2);
      ctx.lineTo(10, 4);
      ctx.lineTo(14, 18);
      ctx.lineTo(0, 10);
      ctx.lineTo(-14, 18);
      ctx.lineTo(-10, 4);
      ctx.lineTo(-18, -2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#dbe9f2";
      ctx.fillRect(-4, -10, 8, 12);
    } else if (this.variant === "scout") {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(16, 0);
      ctx.lineTo(10, 16);
      ctx.lineTo(-10, 16);
      ctx.lineTo(-16, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#d4ed9b";
      ctx.fillRect(-5, -8, 10, 10);
    } else if (this.variant === "gunship") {
      ctx.fillStyle = this.color;
      ctx.fillRect(-24, -16, 48, 34);
      ctx.fillStyle = "#58636c";
      ctx.fillRect(-18, -12, 36, 26);
      ctx.fillStyle = "#e3d48b";
      ctx.fillRect(-10, -8, 20, 10);
      ctx.fillStyle = "#2c343c";
      ctx.fillRect(-32, -4, 10, 18);
      ctx.fillRect(22, -4, 10, 18);
      ctx.fillRect(-8, 18, 16, 8);
    } else if (this.variant === "bomber") {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(26, -6);
      ctx.lineTo(18, 18);
      ctx.lineTo(-18, 18);
      ctx.lineTo(-26, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#dde5ef";
      ctx.fillRect(-8, -10, 16, 10);
      ctx.fillStyle = "#5c2320";
      ctx.fillRect(-20, 6, 40, 6);
    } else if (this.variant === "helicopter") {
      ctx.fillStyle = this.color;
      ctx.fillRect(-16, -10, 32, 24);
      ctx.fillStyle = "#d6e2ed";
      ctx.fillRect(-8, -6, 16, 10);
      ctx.fillStyle = "#2f3942";
      ctx.fillRect(-28, -2, 12, 4);
      ctx.fillRect(16, -2, 18, 4);
      ctx.fillRect(-4, 14, 8, 12);
      ctx.fillRect(-24, -18, 48, 4);
      ctx.fillRect(-2, -22, 4, 12);
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(20, -8);
      ctx.lineTo(18, 16);
      ctx.lineTo(0, 24);
      ctx.lineTo(-18, 16);
      ctx.lineTo(-20, -8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff0a6";
      ctx.beginPath();
      ctx.arc(0, -2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#26303a";
      ctx.fillRect(-18, 2, 36, 5);
    }

    if (this.hitFlash > 0) {
      ctx.globalAlpha = this.hitFlash * 0.55;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-30, -26, 60, 54);
      ctx.globalAlpha = 1;
    }

    if (this.hp < this.maxHp) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(-20, -28, 40, 5);
      ctx.fillStyle = "#8dff9a";
      ctx.fillRect(-20, -28, 40 * (this.hp / this.maxHp), 5);
    }

    ctx.restore();
  }
}

class Boss {
  constructor(game) {
    this.game = game;
    this.x = WIDTH / 2;
    this.y = -120;
    this.targetY = 130;
    this.radius = 64;
    this.hp = 240;
    this.maxHp = this.hp;
    this.age = 0;
    this.dead = false;
    this.arrived = false;
    this.patternCooldown = 1.1;
    this.secondaryCooldown = 2.4;
  }


  pickVariant() {
    if (this.type === "basic") {
      return Math.random() < 0.5 ? "jet" : "scout";
    }
    if (this.type === "heavy") {
      return Math.random() < 0.5 ? "gunship" : "bomber";
    }
    return Math.random() < 0.5 ? "helicopter" : "attack-jet";
  }

  update(dt) {
    this.age += dt;

    if (!this.arrived) {
      this.y = lerp(this.y, this.targetY, dt * 1.4);
      if (Math.abs(this.y - this.targetY) < 4) {
        this.arrived = true;
      }
      return;
    }

    this.x = WIDTH / 2 + Math.sin(this.age * 0.7) * 120;
    this.y = this.targetY + Math.sin(this.age * 1.3) * 16;

    this.patternCooldown -= dt;
    this.secondaryCooldown -= dt;

    if (this.patternCooldown <= 0) {
      this.fireRing();
      this.patternCooldown = 1.1;
    }
    if (this.secondaryCooldown <= 0) {
      this.fireAimedVolley();
      this.secondaryCooldown = 2.6;
    }
  }

  fireRing() {
    const count = 10;
    const baseAngle = this.age * 0.9;
    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (Math.PI * 2 * i) / count;
      this.game.enemyBullets.push(
        new Bullet({
          x: this.x,
          y: this.y + 24,
          vx: Math.cos(angle) * 145,
          vy: Math.sin(angle) * 145 + 70,
          radius: 5,
          damage: 1,
          friendly: false,
          color: "#ff8f6f",
        }),
      );
    }
  }

  fireAimedVolley() {
    const player = this.game.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const base = Math.atan2(dy, dx);

    for (const offset of [-0.3, -0.12, 0.12, 0.3]) {
      const angle = base + offset;
      this.game.enemyBullets.push(
        new Bullet({
          x: this.x + Math.cos(angle) * 28,
          y: this.y + Math.sin(angle) * 14 + 26,
          vx: Math.cos(angle) * 220,
          vy: Math.sin(angle) * 220,
          radius: 6,
          damage: 1,
          friendly: false,
          color: "#ffd26f",
        }),
      );
    }
  }

  damage(amount) {
    this.hp -= amount;
    this.game.shake = Math.max(this.game.shake, 3);
    this.game.createBurst(this.x, this.y, "#ffd698", 9, 38);
    if (this.hp <= 0) {
      this.dead = true;
      this.game.score += 5000;
      this.game.createExplosion(this.x, this.y, "#ffb069", 40, 360);
      this.game.state = GAME_STATE.WIN;
      this.game.stageClearTimer = 0;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const body = ctx.createLinearGradient(0, -54, 0, 54);
    body.addColorStop(0, "#a8b5d9");
    body.addColorStop(0.45, "#687eb8");
    body.addColorStop(1, "#2f4674");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(58, -20);
    ctx.lineTo(70, 16);
    ctx.lineTo(44, 52);
    ctx.lineTo(-44, 52);
    ctx.lineTo(-70, 16);
    ctx.lineTo(-58, -20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#dce8ff";
    ctx.fillRect(-20, -32, 40, 18);
    ctx.fillStyle = "#ff8d68";
    ctx.fillRect(-56, 8, 24, 18);
    ctx.fillRect(32, 8, 24, 18);
    ctx.fillStyle = "#1b2a4f";
    ctx.fillRect(-80, 22, 160, 10);

    ctx.restore();
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = new Input();
    this.lastTime = 0;
    this.state = GAME_STATE.TITLE;
    this.stageDuration = 75;
    this.starfield = this.createStarfield();
    this.frame = this.frame.bind(this);
    this.reset();
  }

  reset() {
    this.player = new Player(this);
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.medals = [];
    this.particles = [];
    this.floatingTexts = [];
    this.boss = null;
    this.score = 0;
    this.time = 0;
    this.waveTimer = 0;
    this.shake = 0;
    this.flash = 0;
    this.stageClearTimer = 0;
    this.backgroundOffset = 0;
    this.playerHitRadius = this.player.radius - 8;
    this.stageCueFlags = {
      opening: false,
      danger: false,
      warning: false,
    };
  }

  createStarfield() {
    return Array.from({ length: 90 }, () => ({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 40 + 30,
      alpha: Math.random() * 0.6 + 0.15,
    }));
  }

  start() {
    this.state = GAME_STATE.PLAYING;
    this.reset();
  }

  spawnEnemy(type, x, y, options = {}) {
    this.enemies.push(new Enemy(this, type, x, y, options));
  }


  pickVariant() {
    if (this.type === "basic") {
      return Math.random() < 0.5 ? "jet" : "scout";
    }
    if (this.type === "heavy") {
      return Math.random() < 0.5 ? "gunship" : "bomber";
    }
    return Math.random() < 0.5 ? "helicopter" : "attack-jet";
  }

  update(dt) {
    if (this.input.wasPressed("Enter")) {
      if (this.state === GAME_STATE.TITLE || this.state === GAME_STATE.GAME_OVER || this.state === GAME_STATE.WIN) {
        this.start();
      }
    }

    if (this.state !== GAME_STATE.PLAYING) {
      this.input.endFrame();
      return;
    }

    this.time += dt;
    this.waveTimer -= dt;
    this.backgroundOffset += dt * 110;
    this.flash = Math.max(0, this.flash - dt * 3.6);
    this.shake = Math.max(0, this.shake - dt * 18);

    if (!this.boss && this.time >= this.stageDuration) {
      this.spawnBoss();
    } else if (!this.boss && this.waveTimer <= 0) {
      this.spawnWave();
    }

    this.player.update(dt, this.input);
    this.updateCollection(this.playerBullets, dt);
    this.updateCollection(this.enemyBullets, dt);
    this.updateCollection(this.powerUps, dt);
    this.updateCollection(this.medals, dt);
    this.updateCollection(this.particles, dt);
    this.updateCollection(this.floatingTexts, dt);

    for (const enemy of this.enemies) {
      enemy.update(dt);
    }

    if (this.boss) {
      this.boss.update(dt);
    }

    this.updateStageFlow();
    this.handleCollisions();
    this.cleanup();
    this.input.endFrame();
  }

  updateStageFlow() {
    if (!this.stageCueFlags.opening && this.time > 2) {
      this.stageCueFlags.opening = true;
      this.floatingTexts.push(new FloatingText(WIDTH / 2, HEIGHT / 2, "SECTOR A-7", "#b9d7ff", 1.1));
    }

    if (!this.stageCueFlags.danger && this.time > 44) {
      this.stageCueFlags.danger = true;
      this.floatingTexts.push(new FloatingText(WIDTH / 2, HEIGHT / 2 - 20, "ENEMY SQUADRON", "#ffd991", 1.1));
      this.flash = Math.max(this.flash, 0.16);
    }

    if (!this.stageCueFlags.warning && this.time > 66) {
      this.stageCueFlags.warning = true;
      this.floatingTexts.push(new FloatingText(WIDTH / 2, HEIGHT / 2, "BOSS APPROACH", "#ff9b7d", 1.2));
      this.flash = Math.max(this.flash, 0.28);
    }
  }

  updateCollection(items, dt) {
    for (const item of items) {
      item.update(dt);
    }
  }

  cleanup() {
    this.playerBullets = this.playerBullets.filter((item) => !item.dead);
    this.enemyBullets = this.enemyBullets.filter((item) => !item.dead);
    this.enemies = this.enemies.filter((item) => !item.dead);
    this.powerUps = this.powerUps.filter((item) => !item.dead);
    this.medals = this.medals.filter((item) => !item.dead);
    this.particles = this.particles.filter((item) => !item.dead);
    this.floatingTexts = this.floatingTexts.filter((item) => !item.dead);
    if (this.boss && this.boss.dead) {
      this.boss = null;
    }
  }

  spawnWave() {
    const intensity = clamp(this.time / this.stageDuration, 0, 1);
    const earlyPhase = this.time < 18;
    const midPhase = this.time >= 18 && this.time < 42;
    const preBossPhase = this.time >= 58;

    if (preBossPhase) {
      this.spawnPreBossWave(intensity);
      return;
    }

    const waveChoice = earlyPhase
      ? Math.floor(Math.random() * 2)
      : midPhase
        ? Math.floor(Math.random() * 3)
        : Math.floor(Math.random() * 4);

    if (waveChoice === 0) {
      const startX = 70 + Math.random() * 80;
      for (let i = 0; i < 5; i += 1) {
        this.spawnEnemy("basic", startX + i * 65, -40 - i * 40, {
          hp: 2,
          speed: 105 + intensity * 50,
          pattern: "drift",
          color: "#6f8877",
          scoreValue: 120,
          dropChance: 0.12,
          medalChance: 0.16,
        });
      }
      this.waveTimer = earlyPhase ? 3.9 : 3.25;
      return;
    }

    if (waveChoice === 1) {
      for (let i = 0; i < 4; i += 1) {
        this.spawnEnemy("basic", 90 + i * 95, -40 - i * 28, {
          hp: 2,
          speed: 125 + intensity * 70,
          pattern: "sine",
          phase: i * 0.8,
          color: "#7a6f66",
          scoreValue: 130,
          dropChance: 0.1,
          medalChance: 0.14,
        });
      }
      this.waveTimer = earlyPhase ? 3.5 : 2.9;
      return;
    }

    if (waveChoice === 2) {
      this.spawnEnemy("heavy", 170, -60, {
        hp: 7,
        speed: 82 + intensity * 34,
        radius: 24,
        pattern: "straight",
        color: "#8a5b49",
        scoreValue: 320,
        dropChance: 0.4,
        medalChance: 0.65,
      });
      this.spawnEnemy("heavy", 310, -120, {
        hp: 7,
        speed: 82 + intensity * 34,
        radius: 24,
        pattern: "straight",
        color: "#8a5b49",
        scoreValue: 320,
        dropChance: 0.4,
        medalChance: 0.65,
      });
      this.waveTimer = 4.15;
      return;
    }

    const turretCount = intensity > 0.35 ? 2 : 1;
    for (let i = 0; i < turretCount; i += 1) {
      this.spawnEnemy("turret", 140 + i * 180, -60 - i * 45, {
        hp: 5,
        speed: 96,
        radius: 22,
        pattern: "drift",
        phase: i,
        fireDelay: 1.25 + i * 0.34,
        color: "#6a7678",
        scoreValue: 380,
        dropChance: 0.28,
        medalChance: 0.4,
      });
    }
    this.waveTimer = Math.max(3.25, 4.8 - intensity * 1.4);
  }

  spawnPreBossWave(intensity) {
    const patternIndex = Math.floor((this.time - 58) / 4) % 2;

    if (patternIndex === 0) {
      for (let i = 0; i < 2; i += 1) {
        this.spawnEnemy("heavy", 150 + i * 180, -70 - i * 40, {
          hp: 8,
          speed: 96 + intensity * 18,
          radius: 25,
          pattern: "straight",
          color: "#8d604a",
          scoreValue: 360,
          dropChance: i === 1 ? 0.55 : 0.2,
          medalChance: 0.8,
        });
      }
      this.spawnEnemy("turret", WIDTH / 2, -120, {
        hp: 6,
        speed: 104,
        radius: 22,
        pattern: "sine",
        fireDelay: 0.95,
        color: "#66767a",
        scoreValue: 420,
        dropChance: 0.2,
        medalChance: 0.55,
      });
    } else {
      for (let i = 0; i < 5; i += 1) {
        this.spawnEnemy("basic", 60 + i * 90, -30 - i * 24, {
          hp: 3,
          speed: 160,
          pattern: i % 2 === 0 ? "sine" : "drift",
          phase: i * 0.7,
          color: "#75806f",
          scoreValue: 160,
          dropChance: i === 2 ? 0.22 : 0,
          medalChance: 0.24,
        });
      }
      this.spawnEnemy("turret", 120, -140, {
        hp: 5,
        speed: 98,
        radius: 22,
        pattern: "drift",
        fireDelay: 1.05,
        color: "#697a82",
        scoreValue: 380,
        dropChance: 0.18,
        medalChance: 0.45,
      });
      this.spawnEnemy("turret", 360, -180, {
        hp: 5,
        speed: 98,
        radius: 22,
        pattern: "drift",
        fireDelay: 1.18,
        color: "#697a82",
        scoreValue: 380,
        dropChance: 0.18,
        medalChance: 0.45,
      });
    }

    this.waveTimer = 4.2;
  }

  spawnBoss() {
    this.enemyBullets.length = 0;
    this.enemies.length = 0;
    this.powerUps.length = 0;
    this.medals.length = 0;
    this.boss = new Boss(this);
    this.flash = 0.7;
    this.floatingTexts.push(new FloatingText(WIDTH / 2, HEIGHT / 2, "WARNING", "#ff9b7d", 1.2));
  }

  handleCollisions() {
    for (const bullet of this.playerBullets) {
      for (const enemy of this.enemies) {
        if (bullet.dead || enemy.dead) {
          continue;
        }
        if (distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) <= (bullet.radius + enemy.radius - 4) ** 2) {
          bullet.dead = true;
          enemy.damage(bullet.damage);
        }
      }

      if (!bullet.dead && this.boss) {
        if (distanceSquared(bullet.x, bullet.y, this.boss.x, this.boss.y) <= (bullet.radius + this.boss.radius - 6) ** 2) {
          bullet.dead = true;
          this.boss.damage(bullet.damage);
        }
      }
    }

    if (this.player.respawnTimer <= 0) {
      for (const bullet of this.enemyBullets) {
        if (!bullet.dead && distanceSquared(bullet.x, bullet.y, this.player.x, this.player.y) <= (bullet.radius + this.playerHitRadius) ** 2) {
          bullet.dead = true;
          this.player.hit();
          break;
        }
      }
    }

    if (this.player.respawnTimer <= 0) {
      for (const enemy of this.enemies) {
        if (!enemy.dead && distanceSquared(enemy.x, enemy.y, this.player.x, this.player.y) <= (enemy.radius + this.playerHitRadius + 3) ** 2) {
          enemy.dead = true;
          this.createExplosion(enemy.x, enemy.y, "#ff9a6e", 16, 240);
          this.player.hit();
        }
      }
    }

    if (this.player.respawnTimer <= 0 && this.boss) {
      if (distanceSquared(this.boss.x, this.boss.y, this.player.x, this.player.y) <= (this.boss.radius + this.playerHitRadius + 6) ** 2) {
        this.player.hit();
      }
    }

    for (const powerUp of this.powerUps) {
      if (!powerUp.dead && distanceSquared(powerUp.x, powerUp.y, this.player.x, this.player.y) <= (powerUp.radius + this.player.radius) ** 2) {
        powerUp.dead = true;
        this.player.collectPowerUp();
        this.score += 150;
        this.flash = 0.18;
      }
    }
    for (const medal of this.medals) {
      if (!medal.dead && distanceSquared(medal.x, medal.y, this.player.x, this.player.y) <= (medal.radius + this.player.radius) ** 2) {
        medal.dead = true;
        this.score += medal.value;
        this.flash = Math.max(this.flash, 0.08);
        this.createBurst(medal.x, medal.y, "#ffd96a", 10, 50);
        this.floatingTexts.push(new FloatingText(medal.x, medal.y - 8, `${medal.value}`, "#ffe08a", 0.7));
      }
    }
  }

  createExplosion(x, y, color, count, speed = 220) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * speed + 40;
      this.particles.push(
        new Particle({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 5 + 2,
          color,
          life: Math.random() * 0.5 + 0.35,
        }),
      );
    }
  }

  createBurst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * speed;
      this.particles.push(
        new Particle({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          size: Math.random() * 3 + 1,
          color,
          life: Math.random() * 0.25 + 0.15,
        }),
      );
    }
  }

  drawBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, "#222a33");
    gradient.addColorStop(0.42, "#161b22");
    gradient.addColorStop(1, "#0b0f15");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const star of this.starfield) {
      const y = (star.y + this.backgroundOffset * (star.speed / 80)) % HEIGHT;
      ctx.fillStyle = `rgba(214, 236, 255, ${star.alpha * 0.28})`;
      ctx.fillRect(star.x, y, star.size, star.size * 1.4);
    }

    const cityOffset = this.backgroundOffset % 180;
    for (let block = -1; block < 6; block += 1) {
      const y = block * 180 + cityOffset;

      ctx.fillStyle = "#313842";
      ctx.fillRect(0, y, WIDTH, 180);

      ctx.fillStyle = "#1e242c";
      ctx.fillRect(0, y + 66, WIDTH, 40);
      ctx.fillStyle = "#474e58";
      ctx.fillRect(0, y + 102, WIDTH, 10);

      ctx.strokeStyle = "rgba(255, 211, 104, 0.14)";
      ctx.lineWidth = 3;
      ctx.setLineDash([16, 18]);
      ctx.beginPath();
      ctx.moveTo(0, y + 86);
      ctx.lineTo(WIDTH, y + 86);
      ctx.stroke();
      ctx.setLineDash([]);

      const avenues = [28, 160, 294, 396];
      for (const avenueX of avenues) {
        ctx.fillStyle = "#232932";
        ctx.fillRect(avenueX, y, 26, 180);
        ctx.strokeStyle = "rgba(255, 214, 118, 0.12)";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 14]);
        ctx.beginPath();
        ctx.moveTo(avenueX + 13, y);
        ctx.lineTo(avenueX + 13, y + 180);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const buildings = [
        { x: 4, w: 54, h: 44 },
        { x: 62, w: 66, h: 58 },
        { x: 188, w: 78, h: 48 },
        { x: 326, w: 58, h: 52 },
        { x: 388, w: 86, h: 62 },
      ];

      for (let i = 0; i < buildings.length; i += 1) {
        const building = buildings[i];
        const top = y + 8 + (i % 3) * 6;
        ctx.fillStyle = "#59636f";
        ctx.fillRect(building.x, top, building.w, building.h);
        ctx.fillStyle = "#434b55";
        ctx.fillRect(building.x + 4, top + 4, building.w - 8, building.h - 8);

        const damageSeed = i % 3;
        if (damageSeed !== 1) {
          ctx.fillStyle = "#1b2027";
          ctx.beginPath();
          ctx.arc(building.x + 12 + damageSeed * 14, top + 14 + damageSeed * 8, 8 + damageSeed * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(building.x + 6, top + building.h - 12, 18 + damageSeed * 6, 8);
        }

        for (let wx = building.x + 10; wx < building.x + building.w - 8; wx += 10) {
          for (let wy = top + 10; wy < top + building.h - 8; wy += 10) {
            ctx.fillStyle = (wx + wy + i * 11) % 5 === 0 ? "rgba(255, 156, 96, 0.18)" : "rgba(170, 196, 220, 0.05)";
            ctx.fillRect(wx, wy, 5, 5);
          }
        }
      }

      ctx.fillStyle = "#697381";
      ctx.fillRect(132, y + 14, 22, 44);
      ctx.fillRect(272, y + 122, 18, 40);
      ctx.fillStyle = "#b5c5d3";
      ctx.fillRect(140, y + 8, 6, 10);
      ctx.fillRect(278, y + 116, 6, 10);

      ctx.fillStyle = "rgba(255, 118, 78, 0.16)";
      ctx.beginPath();
      ctx.arc(86, y + 134, 12, 0, Math.PI * 2);
      ctx.arc(356, y + 28, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(22, 26, 31, 0.9)";
      ctx.beginPath();
      ctx.arc(86, y + 134, 20, 0, Math.PI * 2);
      ctx.arc(356, y + 28, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(116, 128, 140, 0.16)";
      ctx.strokeRect(70, y + 120, 44, 32);
      ctx.strokeRect(346, y + 16, 32, 24);
    }

    ctx.fillStyle = "rgba(71, 97, 118, 0.22)";
    ctx.fillRect(208, 0, 64, HEIGHT);
    ctx.strokeStyle = "rgba(126, 170, 198, 0.14)";
    ctx.lineWidth = 2;
    for (let y = -60; y < HEIGHT + 80; y += 90) {
      ctx.beginPath();
      ctx.moveTo(208, y + cityOffset * 0.35);
      ctx.lineTo(272, y + 34 + cityOffset * 0.35);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255, 142, 86, 0.08)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  drawUI(ctx) {
    ctx.fillStyle = "rgba(5, 10, 18, 0.62)";
    ctx.fillRect(14, 14, 196, 72);
    ctx.strokeStyle = "rgba(122, 199, 255, 0.55)";
    ctx.strokeRect(14, 14, 196, 72);

    ctx.fillStyle = "#e7f4ff";
    ctx.font = "bold 20px Trebuchet MS";
    ctx.textAlign = "left";
    ctx.fillText(`Score ${this.score}`, 24, 40);
    ctx.font = "16px Trebuchet MS";
    ctx.fillText(`Lives ${Math.max(0, this.player.lives)}`, 24, 62);
    ctx.fillText(`Weapon ${this.player.weaponLevel}`, 24, 82);
    if (this.player.invulnerability > 0 && this.state === GAME_STATE.PLAYING) {
      ctx.fillStyle = "#fff1a6";
      ctx.textAlign = "right";
      ctx.fillText("RECOVER", WIDTH - 22, 36);
    }

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(5, 10, 18, 0.58)";
    ctx.fillRect(WIDTH - 162, 14, 148, 32);
    ctx.strokeStyle = "rgba(187, 211, 138, 0.45)";
    ctx.strokeRect(WIDTH - 162, 14, 148, 32);
    ctx.fillStyle = "#dce7b1";
    ctx.fillText(this.boss ? "BOSS ENGAGED" : "STAGE 1", WIDTH - 24, 36);

    if (this.boss) {
      ctx.fillStyle = "rgba(5, 10, 18, 0.8)";
      ctx.fillRect(80, 18, 320, 22);
      ctx.strokeStyle = "#ffb070";
      ctx.strokeRect(80, 18, 320, 22);
      ctx.fillStyle = "#ff8b6a";
      ctx.fillRect(82, 20, 316 * (this.boss.hp / this.boss.maxHp), 18);
      ctx.fillStyle = "#fff2e4";
      ctx.font = "bold 14px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("BOSS", 240, 34);
    }
  }

  drawOverlay(ctx) {
    ctx.textAlign = "center";

    if (this.state === GAME_STATE.TITLE) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = "#f3f8ff";
      ctx.font = "bold 42px Trebuchet MS";
      ctx.fillText("SKY RAID", WIDTH / 2, HEIGHT / 2 - 48);
      ctx.font = "20px Trebuchet MS";
      ctx.fillStyle = "#a7cff8";
      ctx.fillText("Arcade vertical strike prototype", WIDTH / 2, HEIGHT / 2 - 14);
      ctx.fillText("Move with WASD or Arrow Keys", WIDTH / 2, HEIGHT / 2 + 28);
      ctx.fillText("Hold Space to fire", WIDTH / 2, HEIGHT / 2 + 58);
      ctx.fillStyle = "#fff1a8";
      ctx.font = "bold 26px Trebuchet MS";
      ctx.fillText("Press Enter to Start", WIDTH / 2, HEIGHT / 2 + 126);
    }

    if (this.state === GAME_STATE.GAME_OVER) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = "#ffd2bf";
      ctx.font = "bold 42px Trebuchet MS";
      ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT / 2 - 10);
      ctx.font = "20px Trebuchet MS";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`Final Score ${this.score}`, WIDTH / 2, HEIGHT / 2 + 30);
      ctx.fillText("Press Enter to Restart", WIDTH / 2, HEIGHT / 2 + 72);
    }

    if (this.state === GAME_STATE.WIN) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = "#fff2aa";
      ctx.font = "bold 38px Trebuchet MS";
      ctx.fillText("STAGE CLEAR", WIDTH / 2, HEIGHT / 2 - 12);
      ctx.font = "20px Trebuchet MS";
      ctx.fillStyle = "#f1fbff";
      ctx.fillText(`Score ${this.score}`, WIDTH / 2, HEIGHT / 2 + 28);
      ctx.fillText("Press Enter to Play Again", WIDTH / 2, HEIGHT / 2 + 70);
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flash * 0.24})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    this.drawBackground(ctx);

    for (const medal of this.medals) {
      medal.draw(ctx);
    }
    for (const powerUp of this.powerUps) {
      powerUp.draw(ctx);
    }
    for (const bullet of this.playerBullets) {
      bullet.draw(ctx);
    }
    for (const bullet of this.enemyBullets) {
      bullet.draw(ctx);
    }
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }
    if (this.boss) {
      this.boss.draw(ctx);
    }
    this.player.draw(ctx);
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
    for (const text of this.floatingTexts) {
      text.draw(ctx);
    }

    ctx.restore();

    this.drawUI(ctx);
    this.drawOverlay(ctx);
  }

  frame(timestamp) {
    if (!this.lastTime) {
      this.lastTime = timestamp;
    }
    const dt = clamp((timestamp - this.lastTime) / 1000, 0, 0.033);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.frame);
  }
}

const canvas = document.getElementById("game");
const game = new Game(canvas);
requestAnimationFrame(game.frame);

































