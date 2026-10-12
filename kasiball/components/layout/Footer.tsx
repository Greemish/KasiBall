import Link from "next/link";
import { Container } from "./Container";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-4 border-kasi-gold bg-[#111111] text-white">
      <Container>
        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
              KASI<span className="text-kasi-gold">BALL</span>
            </h2>
            <p className="text-base font-semibold text-white">
              Where Every Dream Starts on the Field.
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-white/80">
              A home for organised grassroots football in South African communities.
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-kasi-gold">
              Explore
            </h2>
            <ul className="space-y-1 text-sm">
              {[
                ["/leagues", "Leagues"],
                ["/standings", "Standings"],
                ["/fixtures", "Fixtures"],
                ["/results", "Results"],
                ["/players", "Players"],
                ["/clubs", "Clubs"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-kasi-gold">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-kasi-gold">
              Community
            </h2>
            <ul className="space-y-1 text-sm">
              {[
                ["/clubs", "Club directory"],
                ["/auth/register", "Register a club"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-kasi-gold">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-kasi-gold">
              Account
            </h2>
            <ul className="space-y-1 text-sm">
              {[
                ["/auth/login", "Log in"],
                ["/auth/register", "Register a club"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-kasi-gold">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 py-4 text-xs text-white/60">
          Copyright ©{year} KasiBall. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}