"use client";

export interface BrandSelectorProps {
  items: Array<{ id: number; name: string; logo?: string }>;
  selectedId: string;
  onSelect: (id: string) => void;
  label?: string;
}

export function BrandSelector({
  items,
  selectedId,
  onSelect,
  label = "الماركة (اختياري)",
}: BrandSelectorProps) {
  if (items.length === 0) return null;

  return (
    <section aria-label={label} className="surface-card-soft p-5">
      <div className="text-label mb-3">{label}</div>
      <div className="chip-scroll flex gap-2 overflow-x-auto no-scrollbar" role="radiogroup" aria-label={label}>
        {items.map((brand) => {
          const value = brand.id.toString();
          const isSel = selectedId === value;
          return (
            <button
              key={brand.id}
              type="button"
              role="radio"
              aria-checked={isSel}
              onClick={() => onSelect(isSel ? "" : value)}
              className={`shrink-0 h-11 px-4 sm:px-5 rounded-full text-sm font-semibold transition-all duration-150 border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isSel
                  ? "bg-primary border-primary text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              {brand.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
