import Image from "next/image";
import {RepositorySelectBlock} from "@/components/RepositorySelectForm";

export default function RepositoriesPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#E8EAEF] px-6 py-12 font-[family-name:var(--font-geist-sans)]">
            <div className="flex w-full max-w-md flex-col items-center text-center">
                <Image src="/brands/logo-main.png" alt="GitRank"
                    width={120}
                    height={120}
                    className="h-[120px] w-auto"
                    priority/>
                <h1 className="mt-10 text-xl font-medium tracking-tight text-slate-900 sm:text-2xl">
                    Select your repository
                </h1>
                <RepositorySelectBlock/>
            </div>
        </main>
    );
}
