import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_EMAIL, DEFAULT_PASSWORD } from "@/lib/config";

export interface SessionUser {
  email: string;
  clubName: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("maduration_session")?.value;

  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  return session;
}

export function isDemoCredential(email: string, password: string) {
  return email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD;
}
