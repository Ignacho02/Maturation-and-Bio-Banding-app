import { NextRequest, NextResponse } from "next/server";
import { demoClub } from "@/lib/demo-data";
import { isDemoCredential } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password?.trim() ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials." }, { status: 400 });
  }

  const supabase = createSupabaseClient();

  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
  } else if (!isDemoCredential(email, password)) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    "maduration_session",
    JSON.stringify({ email, clubName: demoClub.name }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );

  return response;
}
