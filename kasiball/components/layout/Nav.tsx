"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "./Container";
import { SessionNav } from "./SessionNav";

const LINKS = [
  { href: "/leagues", label: "Leagues" },
  { href: "/clubs", label: "Clubs" },
  { href: "/players", label: "Players" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/results", label: "Results" },
  { href: "/standings", label: "Standings" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-kasi-green text-white" aria-label="Main navigation">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <ul className="hidden flex-1 items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block border-b-2 border-transparent px-2 py-2 text-sm font-medium text-white/90 transition hover:border-kasi-gold hover:text-white focus-visible:border-kasi-gold sm:px-2.5"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="rounded px-3 py-2 text-sm font-semibold hover:bg-kasi-green-dark lg:hidden"
          >
            {open ? "Close menu" : "Menu"}
          </button>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <form action="/players" className="hidden items-center xl:flex" role="search">
              <input
                type="search"
                name="q"
                placeholder="Search players"
                aria-label="Search players"
                className="w-36 border-0 px-3 py-2 text-sm text-kasi-ink placeholder:text-kasi-muted focus:outline-none focus:ring-2 focus:ring-kasi-gold"
              />
              <button
                type="submit"
                className="bg-kasi-gold px-3 py-2 text-sm font-semibold text-kasi-ink hover:bg-kasi-gold-dark"
              >
                Search
              </button>
            </form>
            <Link
              href="/auth/register"
              className="hidden border border-white/70 px-3 py-2 text-xs font-bold uppercase text-white transition hover:border-kasi-gold hover:text-kasi-gold sm:inline-flex"
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
          className="border-t border-white/20 py-3 lg:hidden"
        >
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-3 text-sm font-medium hover:bg-kasi-green-dark focus-visible:bg-kasi-green-dark"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/players"
                onClick={() => setOpen(false)}
                className="block px-3 py-3 text-sm font-medium hover:bg-kasi-green-dark focus-visible:bg-kasi-green-dark"
              >
                Search players
              </Link>
            </li>
            <li>
              <Link
                href="/auth/register"
                onClick={() => setOpen(false)}
                className="block px-3 py-3 text-sm font-bold text-kasi-gold hover:bg-kasi-green-dark"
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