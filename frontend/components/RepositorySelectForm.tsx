"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type GitHubRepo = {
  id: number;
  full_name: string;
};

export function RepositorySelectBlock() {
  const router = useRouter();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRepos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/github/repos", { credentials: "include" });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body.error === "string" ? body.error : "Could not load repositories.");
        setRepos([]);
        return;
      }
      const data: GitHubRepo[] = await res.json();
      setRepos(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load repositories.");
      setRepos([]);
    } finally {
      setLoading(false);

    }
  },
    [router]
  );

  useEffect(() => {
    void loadRepos();
  }, [loadRepos]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const hasChoices = repos.length > 0;
  const disabled = loading || !!error || !hasChoices;

  const placeholder =
    loading ? "Loading repositories…" : error ? "Could not load list" : hasChoices ? "Select a repository" : "No repositories found";

  const displayLabel = selected || placeholder;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected)
      return;

    router.push(`/profile?repo=${encodeURIComponent(selected)
      }`);
  }

  return (
    <>
      <form className="mt-10 w-full max-w-md"
        onSubmit={handleSubmit}>
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <div ref={containerRef} className="relative flex-1">
            <button
              type="button"
              disabled={disabled}
              aria-haspopup="listbox"
              aria-expanded={open}
              onClick={() => !disabled && setOpen((o) => !o)}
              className={`flex h-12 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-left outline-none transition focus:border-violet-600 disabled:cursor-not-allowed disabled:opacity-60 ${selected === "" ? "text-slate-400" : "text-slate-800"}`}
            >
              <span className="truncate">{displayLabel}</span>
              <svg
                className={`h-5 w-5 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {open && !disabled && (
              <ul
                role="listbox"
                className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              >
                {repos.map((repo) => {
                  const isSelected = selected === repo.full_name;
                  return (
                    <li key={repo.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`w-full truncate px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-violet-50 ${isSelected ? "bg-violet-50 font-medium" : ""}`}
                        onClick={() => {
                          setSelected(repo.full_name);
                          setOpen(false);
                        }}
                      >
                        {repo.full_name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <button type="submit"
            disabled={
              !selected || disabled
            }
            className="h-12 rounded-lg bg-violet-600 px-10 font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
            Send
          </button>
        </div>
        {
          error && (
            <p className="mt-3 text-left text-sm text-red-600">
              {error}
              {" "}
              <button type="button"
                onClick={
                  () => void loadRepos()
                }
                className="font-medium text-violet-600 underline">
                Try again
              </button>
            </p>
          )
        } </form>
      <p className="mt-12 text-center text-sm text-slate-600">
        We just have access to the repositories that you give us permission to.
        <br />
        If you never give us permission,{" "}
        <Link href="https://github.com/settings/applications" className="text-violet-600 underline" target="_blank" rel="noopener noreferrer">
          click here
        </Link>
        .
      </p>
    </>
  );
}
