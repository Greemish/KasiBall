import Link from "next/link";
import { Container } from "./Container";

export function Banner() {
  return (
    <header className="bg-kasi-green-dark text-white">
      <Container>
        <div className="flex min-h-7 items-center justify-between gap-3 py-1 text-[10px] font-bold uppercase tracking-wide">
          <p>Where every dream starts on the field.</p>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">South African grassroots football</span>
            <span role="img" aria-label="South Africa" className="text-sm">
              🇿🇦
            </span>
          </div>
        </div>
      </Container>
    </header>
  );
}