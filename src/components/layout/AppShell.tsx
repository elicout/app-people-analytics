"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Squares2X2Icon,
  IdentificationIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  UserMinusIcon,
  RectangleGroupIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import AiPanel from "./AiPanel";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isPage: boolean;
};

const NAV_ITEMS_PROFILE: NavItem[] = [
  { href: "/employees", label: "Colaboradores", icon: IdentificationIcon, isPage: true },
  { href: "/org", label: "Organograma", icon: RectangleGroupIcon, isPage: true }
];

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Painel Geral", icon: Squares2X2Icon, isPage: true },
  { href: "/dashboard#workforce", label: "Workforce Planning", icon: IdentificationIcon, isPage: false },
  { href: "/dashboard#diversidade", label: "Diversidade", icon: GlobeAltIcon, isPage: false },
  { href: "/dashboard#performance", label: "Performance & Talentos", icon: ArrowTrendingUpIcon, isPage: false },
  { href: "/dashboard#turnover", label: "Turnover", icon: UserMinusIcon, isPage: false }
];

function groupNavItems(items: NavItem[]) {
  const groups: { page: NavItem; children: NavItem[] }[] = [];
  let current: { page: NavItem; children: NavItem[] } | null = null;
  for (const item of items) {
    if (item.isPage) {
      current = { page: item, children: [] };
      groups.push(current);
    } else if (current) {
      current.children.push(item);
    }
  }
  return groups;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Painel de Indicadores",
  "/employees": "Colaboradores",
  "/org": "Organograma",
};

interface AppShellProps {
  children: React.ReactNode;
  userName: string;
  teamName: string;
  teamId: string;
  headcount?: number;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function AppShell({
  children,
  userName,
  teamName,
  teamId,
  headcount = 0,
}: AppShellProps) {
  const pathname = usePathname();
  const [aiCollapsed, setAiCollapsed] = useState(true);
  const [expandedActive, setExpandedActive] = useState<Record<string, boolean>>({});
  const initials = getInitials(userName);
  const title = PAGE_TITLES[pathname] ?? "People Analytics";
  const isDetailPage = pathname !== "/dashboard";

  useEffect(() => {
    setExpandedActive({});
  }, [pathname]);

  function renderNav(items: NavItem[]) {
    const groups = groupNavItems(items);
    return (
      <ul className="space-y-0.5">
        {groups.map(({ page, children }) => {
          const isActive = pathname === page.href;
          const hasChildren = children.length > 0;
          const isOpen = isActive && (expandedActive[page.href] ?? false);
          const Icon = page.icon;
          return (
            <li key={page.href}>
              <Link
                href={page.href}
                onClick={(e) => {
                  if (isActive && hasChildren) {
                    e.preventDefault();
                    setExpandedActive((prev) => ({ ...prev, [page.href]: !prev[page.href] }));
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{page.label}</span>
                {hasChildren && (
                  <ChevronRightIcon
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-in-out ${
                      isOpen ? "rotate-90" : "rotate-0"
                    }`}
                  />
                )}
              </Link>

              {hasChildren && (
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <ul className="mt-0.5 space-y-0.5 pb-1">
                      {children.map((child) => (
                        <li key={child.href + child.label}>
                          <Link
                            href={child.href}
                            onClick={(e) => {
                              const hash = child.href.split("#")[1];
                              if (hash && pathname === page.href) {
                                e.preventDefault();
                                document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
                              }
                            }}
                            className="flex items-center gap-3 rounded-lg py-2 pl-9 pr-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-gray-50">
        {/* User profile */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-normal text-gray-900">{userName}</p>
              <p className="truncate text-xs text-gray-700">
                {teamName} · {headcount} liderados
              </p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-0 py-4 pb-0">
            {renderNav(NAV_ITEMS_PROFILE)}
          </nav>
        </div>
        <hr className="mx-3 border-gray-100" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5 mb-0.5">
            <li>
              <button
                onClick={() => setAiCollapsed((v) => !v)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  !aiCollapsed
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <SparklesIcon className="h-4 w-4 shrink-0 text-purple-500" />
                Assistente IA
              </button>
            </li>
          </ul>
          {renderNav(NAV_ITEMS)}
        </nav>
        <hr className="mx-3 border-slate-200" />

        {/* Footer */}
        <div className="px-3 py-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="ml-64 flex flex-1 overflow-hidden">
        {/* AI panel — sits right after the sidebar, pushes main content */}
        <AiPanel collapsed={aiCollapsed} onToggle={() => setAiCollapsed((v) => !v)} teamId={teamId} />

        {/* Main column */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              {isDetailPage && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Voltar
                </Link>
              )}
              <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            </div>
          </header>

          {/* Page content */}
          <main key={pathname} className="flex-1 overflow-y-auto animate-page-enter">{children}</main>
        </div>
      </div>
    </div>
  );
}
