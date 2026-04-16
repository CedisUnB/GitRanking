export default async function RepositoryOverview({
}: {
  params: { owner: string; repo: string };
}) {
  return (
    <main className="mx-auto max-w-6xl">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
        <p className="mt-3 text-sm text-slate-500">
          Esta pagina ficara vazia por enquanto.
        </p>
      </div>
    </main>
  );
}

