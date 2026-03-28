import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 });
  }
  // Placeholder until Notification model: no persistent unread state
  return NextResponse.json({ count: 0 });
}
