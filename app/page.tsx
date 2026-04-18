import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";

export default async function Home() {
  const session = await requireAuth();

  if (!session) {
    redirect("/login");
  }

  // Auto-redirect based on role
  if (session.role === "admin") {
    redirect("/admin");
  } else if (session.role === "kasir") {
    redirect("/kasir");
  } else if (session.role === "kitchen") {
    redirect("/kitchen");
  }

  // Fallback
  redirect("/login");
}
