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
      </div>
    </div>
  );
}
