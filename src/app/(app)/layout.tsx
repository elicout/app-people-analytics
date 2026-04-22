import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { query } from "@/lib/db/client";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const hc = await query<{ c: number }>(
    "SELECT CAST(COUNT(*) AS INTEGER) as c FROM employees WHERE team_id=? AND status!='terminated'",
    [session.user.teamId]
  );

  return (
    <AppShell
      userName={session.user.name ?? ""}
      teamName={session.user.teamName}
      teamId={session.user.teamId}
      headcount={hc[0]?.c ?? 0}
    >
      {children}
    </AppShell>
  );
}
