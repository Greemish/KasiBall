"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Container } from "./Container";
import { SessionNav } from "./SessionNav";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/leagues", label: "Leagues" },
  { href: "/clubs", label: "Clubs" },
  { href: "/players", label: "Players" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/results", label: "Results" },
  { href: "/standings", label: "Standings" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || Boolean(pathname?.startsWith(`${href}/`));

  return (
    <nav className="border-b border-kasi-border bg-white text-kasi-ink shadow-sm" aria-label="Main navigation">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3 py-2">
          <Link href="/" className="flex min-w-0 flex-col leading-tight">
            <span className="text-lg font-black tracking-tight text-kasi-green">
              KASI<span className="text-kasi-gold">BALL</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wide text-kasi-muted">
              Grassroots football
            </span>
          </Link>

          <ul className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`block border-b-2 px-2 py-2 text-xs font-semibold transition sm:px-2.5 ${
                    isActive(l.href)
                      ? "border-kasi-gold text-kasi-green"
                      : "border-transparent text-kasi-ink hover:border-kasi-gold hover:text-kasi-green"
                  }`}
                >
                  {l.label}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="border border-kasi-border px-3 py-2 text-sm font-semibold hover:bg-kasi-surface lg:hidden"
          >
            {open ? "Close menu" : "Menu"}
          </button>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <form action="/players" className="hidden items-center xl:flex" role="search">
              <label htmlFor="site-player-search" className="sr-only">
                Search players
              </label>
              <input
                id="site-player-search"
                type="search"
                name="q"
                placeholder="Search players"
                className="w-32 border border-kasi-border px-2 py-1.5 text-xs text-kasi-ink placeholder:text-kasi-muted focus:border-kasi-green focus:outline-none focus:ring-1 focus:ring-kasi-green"
              />
              <button
                type="submit"
                className="bg-kasi-gold px-2 py-1.5 text-xs font-semibold text-kasi-ink hover:bg-kasi-gold-dark"
              >
                Search
              </button>
            </form>
            <Link
              href="/auth/register"
              className="hidden border border-kasi-green px-3 py-2 text-[10px] font-bold uppercase text-kasi-green transition hover:bg-kasi-green hover:text-white sm:inline-flex"
            >
              <span className="sm:hidden">Register</span>
              <span className="hidden sm:inline">Register club</span>
            </Link>
            <SessionNav />
          </div>
        </div>

        <div
          id="mobile-menu"
          hidden={!open}
          className="border-t border-kasi-border py-3 lg:hidden"
        >
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`block px-3 py-3 text-sm font-medium hover:bg-kasi-surface focus-visible:bg-kasi-surface ${
                    isActive(l.href) ? "text-kasi-green" : "text-kasi-ink"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/players"
                onClick={() => setOpen(false)}
                className="block px-3 py-3 text-sm font-medium text-kasi-ink hover:bg-kasi-surface focus-visible:bg-kasi-surface"
              >
                Search players
              </Link>
            </li>
            <li>
              <Link
                href="/auth/register"
                onClick={() => setOpen(false)}
                className="block px-3 py-3 text-sm font-bold text-kasi-green hover:bg-kasi-surface"
              >
                Register club
              </Link>
            </li>
          </ul>
        </div>
      </Container>
    </nav>
  );
}