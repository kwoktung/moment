import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getNextAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = getCloudflareContext({ async: false });
  const env = context.env;
  const { auth } = getNextAuth(env);
  const session = await auth();
  if (!session) {
    redirect("/sign-in");
  }
  return <>{children}</>;
}
