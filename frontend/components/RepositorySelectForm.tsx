"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";

type GitHubRepo = {
    id: number;
    full_name: string;
};

export function RepositorySelectBlock() {
        const router = useRouter();
        const [repos, setRepos] = useState < GitHubRepo[] > ([]);
        const [selected, setSelected] = useState("");
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState < string | null > (null);

        const loadRepos = useCallback(async () => {
                setLoading(true);
                setError(null);
                try {
                    const res = await fetch("/api/github/repos", {credentials: "include"});
                    if (res.status === 401) {
                        router.replace("/login");
                        return;
                    }
                    if (! res.ok) {
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
                
            }},
        [router]
    );

    useEffect(() => {
        void loadRepos();
    }, [loadRepos]);

    const hasChoices = repos.length > 0;

    function handleSubmit(e : React.FormEvent) {
        e.preventDefault();
        if (!selected) 
            return;
        
        router.push(`/profile?repo=${
            encodeURIComponent(selected)
        }`);
    }

    return (
        <>
            <form className="mt-10 w-full max-w-md"
                onSubmit={handleSubmit}>
                <div className="flex w-full flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <select value={selected}
                            onChange={
                                (e) => setSelected(e.target.value)
                            }
                            disabled={
                                loading || !!error || ! hasChoices
                            }
                            className={
                                `h-12 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-4 outline-none transition focus:border-violet-600 disabled:cursor-not-allowed disabled:opacity-60 ${
                                    selected === "" ? "text-slate-400" : "text-slate-800"
                                }`
                        }>
                            <option value="">
                                {
                                loading ? "Loading repositories…" : error ? "Could not load list" : hasChoices ? "Select a repository" : "No repositories found"
                            } </option>
                            {
                            repos.map((repo) => (
                                <option key={
                                        repo.id
                                    }
                                    value={
                                        repo.full_name
                                }>
                                    {
                                    repo.full_name
                                } </option>
                            ))
                        } </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                    <button type="submit"
                        disabled={
                            !selected || loading || !!error
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
                <br/>
                If you never give us permission,{" "}
                <Link href="https://github.com/settings/applications" className="text-violet-600 underline" target="_blank" rel="noopener noreferrer">
                    click here
                </Link>
                .
            </p>
        </>
    );
}
