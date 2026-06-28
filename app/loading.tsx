export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-400">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-orange-500/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
        <div className="text-sm tracking-wider">加载中…</div>
      </div>
    </main>
  );
}
