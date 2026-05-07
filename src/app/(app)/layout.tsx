import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getRepositories } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { employees } = getRepositories();
  const headcount = await employees.getHeadcount(session.user.email!);

  return (
    <AppShell
      userName={session.user.name ?? ""}
      teamName={session.user.teamName}
      teamId={session.user.teamId}
      headcount={headcount}
    >
      {children}
    </AppShell>
  );
}
