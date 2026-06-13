"use client";

import { usePathname } from "next/navigation";

type CrtDisplayShellProps = {
  children: React.ReactNode;
};

export function CrtDisplayShell({ children }: CrtDisplayShellProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/editor")) {
    return <>{children}</>;
  }

  return (
    <div className="crt-stage">
      <div className="crt-cabinet">
        <div className="crt-bezel">
          <div className="crt-screen-shell">
            <div className="crt-screen-content">{children}</div>
          </div>
        </div>
        <aside className="crt-side-panel" aria-hidden="true">
          <div className="crt-speaker-grille" />
          <div className="crt-control-bay">
            <div className="crt-brand">
              <span>NEC</span>
              <i />
              <i />
              <i />
            </div>
            <p>AUTO COLOUR</p>
            <div className="crt-channel-strip">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((channel) => (
                <span key={channel} className={channel === "1" ? "is-active" : ""}>
                  {channel}
                </span>
              ))}
            </div>
            <div className="crt-sliders">
              <span />
              <span />
            </div>
            <div className="crt-power-light" />
            <div className="crt-power-button" />
          </div>
        </aside>
      </div>
    </div>
  );
}
