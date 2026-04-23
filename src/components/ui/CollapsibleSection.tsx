"use client";

import { useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/solid";

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
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-8 pt-4 pb-4 mb-2 group"
      >
        <ChevronRightIcon
          className={`h-4 w-4 text-gray-700 transition-transform duration-300 ease-in-out group-hover:text-gray-900 ${
            open ? "rotate-90" : "rotate-0"
          }`}
        />
        <h2 className="text-lg font-regular text-gray-800 group-hover:text-gray-950 transition-colors">
          {title}
        </h2>
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-8 pb-8">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
