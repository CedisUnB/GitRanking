"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The sign-in link is no longer valid.",
  OAuthCallback: "There was a problem signing in with GitHub.",
  Default: "An unexpected error occurred. Please try again.",
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Default";
  const message = errorMessages[error] ?? errorMessages.Default;

  return (
    <div className="w-full max-w-md rounded-2xl bg-white px-10 py-10 shadow-lg ring-1 ring-black/5 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">
        Authentication Error
      </h1>
      <p className="mt-4 text-slate-600">{message}</p>
      <Link
        href="/login"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-[#4B1E78] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3F1864]"
      >
        Back to login
      </Link>
    </div>
  );
}

export default function AuthError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#E9ECF1]">
      <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
        <ErrorContent />
      </Suspense>
    </main>
  );
}
