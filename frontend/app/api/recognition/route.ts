import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardRecognitionBadge } from "@/lib/badges";

const VALID_REASONS = ["innovation", "leadership", "teamwork", "others"] as const;
type Reason = (typeof VALID_REASONS)[number];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { recipientUsername, message, reason, owner, repo } = body as {
    recipientUsername: string;
    message: string;
    reason: string;
    owner: string;
    repo: string;
  };

  if (
    !recipientUsername ||
    !message?.trim() ||
    !VALID_REASONS.includes(reason as Reason) ||
    !owner ||
    !repo
  ) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const sender = await prisma.user.findFirst({
    where: { username: session.user.username },
  });
  if (!sender) {
    return NextResponse.json({ error: "Sender not found" }, { status: 404 });
  }

  if (sender.username === recipientUsername) {
    return NextResponse.json(
      { error: "Cannot recognize yourself" },
      { status: 400 },
    );
  }

  const recipient = await prisma.user.findFirst({
    where: { username: recipientUsername },
  });
  if (!recipient) {
    return NextResponse.json(
      { error: "Recipient not found in system" },
      { status: 404 },
    );
  }

  const repository = await prisma.repository.findFirst({
    where: { owner, name: repo },
  });
  if (!repository) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const normalizedReason = reason.toLowerCase() as Reason;

  await prisma.recognitionMessage.create({
    data: {
      senderId: sender.id,
      recipientId: recipient.id,
      message: message.trim(),
      reason: normalizedReason,
      repositoryId: repository.id,
    },
  });

  if (normalizedReason !== "others") {
    await awardRecognitionBadge(recipient.id, repository.id, normalizedReason);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing owner or repo" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({
    where: { username: session.user.username },
  });
  if (!user) {
    return NextResponse.json({ recognitions: [] });
  }

  const repository = await prisma.repository.findFirst({
    where: { owner, name: repo },
  });
  if (!repository) {
    return NextResponse.json({ recognitions: [] });
  }

  const recognitions = await prisma.recognitionMessage.findMany({
    where: { recipientId: user.id, repositoryId: repository.id },
    orderBy: { createdAt: "desc" },
    include: { sender: { select: { username: true, name: true } } },
  });

  return NextResponse.json({ recognitions });
}
