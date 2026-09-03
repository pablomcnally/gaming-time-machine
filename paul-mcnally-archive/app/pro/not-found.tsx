import Link from "next/link";
export default function NotFound() {
  return <div className="pro-container pro-page pro-empty"><p className="pro-eyebrow">404</p><h1>This page isn&apos;t here.</h1><p>The work you are looking for may have moved.</p><Link className="pro-button" href="/pro/work">Browse the portfolio</Link></div>;
}
