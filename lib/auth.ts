// Client-side auth functions only (safe for browser)
// Uses sessionStorage - isolated per tab

export interface User {
  id: string;
  username: string;
  name: string;
  role: "kasir" | "kitchen";
}

export function setSession(user: User) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("pos_session", JSON.stringify(user));
  }
}

export function getSessionClient(): User | null {
  if (typeof window === "undefined") return null;
  const session = sessionStorage.getItem("pos_session");
  if (!session) return null;
  try {
    return JSON.parse(session) as User;
  } catch {
    return null;
  }
}

export function clearSessionClient() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("pos_session");
  }
}
