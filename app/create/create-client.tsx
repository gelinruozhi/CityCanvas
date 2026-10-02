"use client";

import dynamic from "next/dynamic";
import { AnnotationDetailPanel } from "@/components/map/annotation-detail-panel";
import { FabControls } from "@/components/map/fab-controls";
import { CreateAnnotationDialog } from "@/components/map/create-annotation-dialog";
import { PublishCreationDialog } from "@/components/map/publish-creation-dialog";
import { AnnotationsListPanel } from "@/components/map/annotations-list-panel";
import { BuildingPanel } from "@/components/map/building-panel";
import { KeyboardShortcuts } from "@/components/map/keyboard-shortcuts";
import { UserBadge } from "@/components/user-badge";

const CanvasMap = dynamic(
  () => import("@/components/map/canvas-map").then((m) => m.CanvasMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-zinc-950 text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <div className="text-sm">正在加载校园地图…</div>
        </div>
      </div>
    ),
  }
);

export function CreateClient() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-zinc-950">
      <KeyboardShortcuts />

      <div className="absolute inset-0">
        <CanvasMap />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <UserBadge />
        <AnnotationsListPanel />
        <FabControls />
        <BuildingPanel />
        <AnnotationDetailPanel />
      </div>

      <CreateAnnotationDialog />
      <PublishCreationDialog />
    </main>
  );
}
