import Link from "next/link";
import { Container } from "./Container";

export function Banner() {
  return (
    <header className="border-b border-kasi-border bg-white">
      <Container>
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border-l-4 border-kasi-gold bg-kasi-green text-lg font-bold text-white">
              KB
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-xl font-bold text-kasi-green">KasiBall</span>
              <span className="mt-1 truncate text-xs text-kasi-muted sm:text-sm">
                Where Every Dream Starts on the Field.
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 border-l border-kasi-border pl-4 sm:gap-3 sm:pl-6">
            <span className="hidden text-right text-xs text-kasi-muted sm:block">
              South African<br />grassroots football
            </span>
            <span role="img" aria-label="South Africa" className="text-2xl">
              🇿🇦
            </span>
          </div>
        </div>
      </Container>
    </header>
  );
}