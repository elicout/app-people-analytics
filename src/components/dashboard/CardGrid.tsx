import { Children, isValidElement, ReactNode } from "react";

const COLS = 4;

const colSpanClass: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
};

export default function CardGrid({ children }: { children: ReactNode }) {
  let col = 0;

  return (
    <div className="grid grid-cols-4 gap-5">
      {Children.toArray(children)
        .filter(isValidElement)
        .map((child, i) => {
          const rawSpan = (child.props as Record<string, unknown>).span;
          const span =
            rawSpan === "fill"
              ? COLS - col
              : typeof rawSpan === "number"
                ? rawSpan
                : 1;

          col = (col + span) % COLS;

          return (
            <div key={i} className={`${colSpanClass[span] ?? "col-span-1"} grid`}>
              {child}
            </div>
          );
        })}
    </div>
  );
}
