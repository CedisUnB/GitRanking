"use client";

import { signIn } from "next-auth/react";

export function GitHubSignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("github", { callbackUrl: "/repositories" })}
      className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-[#4B1E78] px-5 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-[#3F1864] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B1E78] focus-visible:ring-offset-2"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-current">
        <path d="M12 .5C5.73.5.75 5.78.75 12.3c0 5.22 3.44 9.64 8.2 11.2.6.12.82-.27.82-.58v-2.03c-3.34.74-4.04-1.68-4.04-1.68-.55-1.44-1.34-1.82-1.34-1.82-1.1-.78.08-.76.08-.76 1.22.09 1.86 1.29 1.86 1.29 1.08 1.9 2.83 1.35 3.52 1.03.11-.81.42-1.35.76-1.66-2.66-.32-5.46-1.38-5.46-6.15 0-1.36.46-2.47 1.22-3.34-.12-.32-.53-1.6.12-3.33 0 0 1-.33 3.3 1.28.96-.28 1.99-.41 3.01-.42 1.02.01 2.05.14 3.01.42 2.3-1.61 3.3-1.28 3.3-1.28.65 1.73.24 3.01.12 3.33.76.87 1.22 1.98 1.22 3.34 0 4.79-2.8 5.83-5.47 6.14.43.38.82 1.14.82 2.3v3.4c0 .32.22.7.83.58 4.76-1.56 8.2-5.98 8.2-11.2C23.25 5.78 18.27.5 12 .5z" />
      </svg>
      Sign in with GitHub
    </button>
  );
}
