"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavLinks({ user, t = (s) => s, onNavClick }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const isLoggedIn = !!user;

  const isHome = pathname === "/" && (!viewParam || viewParam === "home");
  const isLevels = pathname === "/" && viewParam === "search";
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <div className="nav-links">
      <Link
        href="/?view=home"
        className={isHome ? "active" : ""}
        aria-current={isHome ? "page" : undefined}
        onClick={onNavClick}
      >
        {t('nav.home') || "Home"}
      </Link>
      <Link
        href="/?view=search"
        className={isLevels ? "active" : ""}
        aria-current={isLevels ? "page" : undefined}
        onClick={onNavClick}
      >
        {t('nav.levels') || "Levels"}
      </Link>
      {isLoggedIn && (
        <Link
          href="/dashboard"
          className={isDashboard ? "active" : ""}
          aria-current={isDashboard ? "page" : undefined}
          onClick={onNavClick}
        >
          {t('nav.dashboard') || "Dashboard"}
        </Link>
      )}
    </div>
  );
}
