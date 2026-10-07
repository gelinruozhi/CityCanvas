import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Annotation,
  AIScore,
  AnnotationShape,
  ShapeBounds,
  CampusBuilding,
} from "@/lib/types";

const HISTORY_LIMIT = 30;

export interface PendingAnnotationShape {
  x: number;
  y: number;
  shape: AnnotationShape;
  radius?: number;
  bounds?: ShapeBounds;
}

interface AnnotationStore {
  annotations: Annotation[];
  selectedId: string | null;
  isDarkMap: boolean;
  isSatellite: boolean;
  /** 待创建标注（打开创作面板时） */
  pendingPosition: PendingAnnotationShape | null;
  /** 当前绘图工具：point 直接点击，circle/rect 进入拖拽绘制 */
  drawTool: AnnotationShape;
  isPublishOpen: boolean;
  /** 点选的可交互建筑（室外建筑模式） */
  selectedBuilding: CampusBuilding | null;
  /** 室内编辑楼层（选中建筑 + 选层后进入室内模式） */
  indoorFloor: string | null;

  // Undo / redo
  past: Annotation[][];
  future: Annotation[][];

  addAnnotation: (data: Omit<Annotation, "id" | "aiScore" | "createdAt">) => string;
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  setAIScore: (id: string, score: AIScore) => void;
  removeAnnotation: (id: string) => void;
  clearAll: () => void;
  selectAnnotation: (id: string | null) => void;
  toggleMapTheme: () => void;
  toggleSatellite: () => void;

  setDrawTool: (tool: AnnotationShape) => void;
  openCreateDialog: (
    x: number,
    y: number,
    extra?: { shape?: AnnotationShape; radius?: number; bounds?: ShapeBounds }
  ) => void;
  closeCreateDialog: () => void;

  selectBuilding: (building: CampusBuilding | null) => void;
  setIndoorFloor: (floor: string | null) => void;

  openPublishDialog: () => void;
  closePublishDialog: () => void;

  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const genId = () =>
  `a_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

/**
 * 把当前 annotations 推入 past 栈，并清空 future。供任何会修改标点列表的 mutator 调用。
 * 每次只保留最近 HISTORY_LIMIT 条历史，避免内存膨胀。
 */
function pushHistory(state: AnnotationStore): Pick<AnnotationStore, "past" | "future"> {
  const past = [...state.past, state.annotations];
  if (past.length > HISTORY_LIMIT) past.shift();
  return { past, future: [] };
}

export const useAnnotationStore = create<AnnotationStore>()(
  persist(
    (set, get) => ({
      annotations: [],
      selectedId: null,
      isDarkMap: true,
      isSatellite: false,
      pendingPosition: null,
      drawTool: "point",
      isPublishOpen: false,
      selectedBuilding: null,
      indoorFloor: null,
      past: [],
      future: [],

  addAnnotation: (data) => {
    const id = genId();
    set((s) => ({
      ...pushHistory(s),
      annotations: [
        ...s.annotations,
        { ...data, id, aiScore: null, createdAt: Date.now() },
      ],
      selectedId: id,
      pendingPosition: null,
    }));
    return id;
  },

  updateAnnotation: (id, patch) =>
    set((s) => ({
      ...pushHistory(s),
      annotations: s.annotations.map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
    })),

  setAIScore: (id, score) =>
    set((s) => ({
      annotations: s.annotations.map((a) =>
        a.id === id ? { ...a, aiScore: score } : a
      ),
    })),

  removeAnnotation: (id) =>
    set((s) => ({
      ...pushHistory(s),
      annotations: s.annotations.filter((a) => a.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  clearAll: () =>
    set((s) => ({
      ...pushHistory(s),
      annotations: [],
      selectedId: null,
    })),

  selectAnnotation: (id) => set({ selectedId: id }),

  toggleMapTheme: () => set((s) => ({ isDarkMap: !s.isDarkMap })),

  toggleSatellite: () => set((s) => ({ isSatellite: !s.isSatellite })),

  setDrawTool: (tool) =>
    // 不做"再点一次取消"的 toggle——选中态已在按钮上可见，
    // 重复点击同一工具保持激活，避免误触把矩形悄悄切回点位导致"画不了"
    set({
      drawTool: tool,
      pendingPosition: null,
      selectedBuilding: null,
      indoorFloor: null,
    }),

  openCreateDialog: (x, y, extra) =>
    set({
      pendingPosition: {
        x,
        y,
        shape: extra?.shape ?? "point",
        radius: extra?.radius,
        bounds: extra?.bounds,
      },
    }),
  closeCreateDialog: () =>
    // 保留 drawTool：关闭弹窗不退出绘制模式，方便连续画多个形状；
    // 退出绘制走 FAB「退出绘制」按钮或 Esc 退出链
    set({ pendingPosition: null }),

  selectBuilding: (building) =>
    set({
      selectedBuilding: building,
      // 选中建筑时退出标点选中，避免右侧面板互相叠
      selectedId: null,
    }),

  setIndoorFloor: (floor) => set({ indoorFloor: floor }),

  openPublishDialog: () => set({ isPublishOpen: true }),
  closePublishDialog: () => set({ isPublishOpen: false }),

  undo: () => {
    const s = get();
    if (s.past.length === 0) return false;
    const previous = s.past[s.past.length - 1];
    set({
      annotations: previous,
      past: s.past.slice(0, -1),
      future: [s.annotations, ...s.future].slice(0, HISTORY_LIMIT),
      selectedId: null,
    });
    return true;
  },

  redo: () => {
    const s = get();
    if (s.future.length === 0) return false;
    const next = s.future[0];
    set({
      annotations: next,
      past: [...s.past, s.annotations].slice(-HISTORY_LIMIT),
      future: s.future.slice(1),
      selectedId: null,
    });
    return true;
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
    }),
    {
      name: "citycanvas-draft",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // 只持久化草稿标注；undo 栈/UI 状态不存。
      // skipHydration：由 CreateClient 挂载后手动 rehydrate，避免 SSR hydration mismatch
      partialize: (s) => ({ annotations: s.annotations }) as AnnotationStore,
      skipHydration: true,
    }
  )
);
