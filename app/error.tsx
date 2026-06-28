"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CityCanvas global error]", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-6 text-zinc-100">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-white">出错了</h1>
        <p className="mt-3 text-sm text-zinc-400">
          {error.message || "页面渲染过程中发生未预期错误。"}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-[10px] text-zinc-600">
            digest: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-orange-500/30 transition hover:shadow-xl"
          >
            <RefreshCcw className="h-4 w-4" />
            重试
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
          >
            <Home className="h-4 w-4" />
            回首页
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
