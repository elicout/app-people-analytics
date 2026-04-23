import { ReactNode } from "react";

export default function CardGrid({ children }: { children: ReactNode }) {
  return <div className="space-y-5">{children}</div>;
}
