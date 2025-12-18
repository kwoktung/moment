import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/next/session";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getCloudflareContext({ async: true });
  const session = await getSession(context.env.JWT_SECRET);

  if (!session) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
