"use client";

import { useState } from "react";

interface Props {
  title: string;
  id?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({ title, id, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id}>
      <div className="flex items-center gap-3 px-8 pt-4 pb-4 mb-2">
        <h2 className="text-base font-bold tracking-widest text-gray-800">{title}</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors text-xs leading-none"
        >
          {open ? "−" : "+"}
        </button>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      {open && <div className="px-16 pb-8">{children}</div>}
    </section>
  );
}
