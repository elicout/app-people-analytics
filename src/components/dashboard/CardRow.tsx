import { Children, isValidElement, ReactNode } from "react";

export default function CardRow({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(isValidElement);

  const totalCols = items.reduce((sum, child) => {
    const span = (child.props as Record<string, unknown>).span;
    return sum + (typeof span === "number" ? span : 1);
  }, 0);

  return (
    <div
      className="grid gap-5"
      style={{ gridTemplateColumns: `repeat(${totalCols}, 1fr)` }}
    >
      {items.map((child, i) => {
        const span = (child.props as Record<string, unknown>).span;
        const colSpan = typeof span === "number" ? span : 1;

        return (
          <div
            key={i}
            style={{ gridColumn: `span ${colSpan}` }}
            className="min-w-0 grid"
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
