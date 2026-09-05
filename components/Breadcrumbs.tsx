import Link from 'next/link';

type Crumb = { name: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/45">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="inline-flex items-center gap-1.5 min-w-0">
              {i > 0 && <span className="text-white/25" aria-hidden>/</span>}
              {last || !item.href ? (
                <span className={last ? 'text-white/70' : undefined}>{item.name}</span>
              ) : (
                <Link href={item.href} className="hover:text-[#FF2D87] transition-colors">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
