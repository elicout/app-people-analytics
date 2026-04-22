"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Globe,
  TrendingUp,
  UserMinus,
  GitBranch,
  Sparkles,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import AiPanel from "./AiPanel";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel Geral", icon: LayoutDashboard, isPage: true },
  { href: "/dashboard#workforce", label: "Workforce Planning", icon: Users, isPage: false },
  { href: "/dashboard#diversidade", label: "Diversidade", icon: Globe, isPage: false },
  { href: "/dashboard#performance", label: "Performance & Talentos", icon: TrendingUp, isPage: false },
  { href: "/dashboard#turnover", label: "Turnover", icon: UserMinus, isPage: false },
  { href: "/employees", label: "Colaboradores", icon: Users, isPage: true },
  { href: "/org", label: "Organograma", icon: GitBranch, isPage: true },
];

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
  const [aiOpen, setAiOpen] = useState(false);
  const initials = getInitials(userName);
  const title = PAGE_TITLES[pathname] ?? "People Analytics";
  const isDetailPage = pathname !== "/dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
        {/* Logo
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-900 text-xs font-bold text-white">
            PA
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">People Analytics</p>
            <p className="text-xs text-slate-500">Dashboard de Gestão</p>
          </div>
        </div> */}

        {/* User profile */}
        <div className="border-b border-slate-200 px-4 py-3 h-16">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
              <p className="truncate text-xs text-slate-500">
                {teamName} · {headcount} liderados
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = item.isPage ? pathname === item.href : false;
              const Icon = item.icon;
              return (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-900"
                        : item.isPage
                          ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          : "pl-9 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    {item.isPage && <Icon className="h-4 w-4 shrink-0" />}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 px-3 py-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {isDetailPage && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            )}
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
          <button
            onClick={() => setAiOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            Assistente IA
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* AI panel */}
      <AiPanel open={aiOpen} onClose={() => setAiOpen(false)} teamId={teamId} />
    </div>
  );
}
