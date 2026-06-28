import Link from "next/link";
import { Compass, Home, MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-zinc-950 px-6 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20">
          <Compass className="h-10 w-10" />
        </div>
        <h1 className="text-7xl font-bold tracking-tighter">
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
            404
          </span>
        </h1>
        <h2 className="mt-2 text-xl font-semibold text-white">
          这片地图我们还没画到
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          你访问的路径不存在，或者作品已经被作者删除。
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl"
          >
            <Home className="h-4 w-4" />
            回首页
          </Link>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
          >
            <MapPin className="h-4 w-4" />
            去广场看看
          </Link>
        </div>
      </div>
    </main>
  );
}
