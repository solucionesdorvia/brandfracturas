import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userLabel = session.user?.name || session.user?.email || "";

  return (
    <div className="min-h-screen">
      <AppHeader userLabel={userLabel} />
      <main className="container py-8">{children}</main>
    </div>
  );
}
