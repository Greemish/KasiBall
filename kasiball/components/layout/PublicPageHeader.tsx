import { Container } from "./Container";

export function PublicPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="bg-kasi-green py-6 text-white sm:py-8">
      <Container>
        <p className="text-xs font-bold uppercase tracking-wide text-kasi-gold">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
            {description}
          </p>
        )}
      </Container>
    </header>
  );
}
