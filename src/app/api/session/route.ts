import { NextResponse } from "next/server";
import { createSession, checkOrigin } from "@/lib/server/session";
import { DomainError, fail } from "@/lib/server/validation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await request.json();
    if (!["manager", "staff"].includes(body.role)) fail("Choose a demo staff or manager role.");
    if (
      process.env.ESTOCK_DEMO_ACCESS_CODE &&
      body.accessCode !== process.env.ESTOCK_DEMO_ACCESS_CODE
    )
      fail("Demo access code is incorrect.", 403);
    const token = createSession(body.role);
    const response = NextResponse.json({ message: `Synthetic ${body.role} session selected.` });
    response.cookies.set("estock-demo-session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: 86400,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof DomainError ? error.message : "Could not start demo session." },
      { status: error instanceof DomainError ? error.status : 400 },
    );
  }
}
