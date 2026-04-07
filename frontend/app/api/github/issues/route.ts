import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(
    "https://api.github.com/issues?filter=all&state=open&per_page=100",
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: response.status }
    );
  }

  const issues = await response.json();
  return NextResponse.json(issues);
}
