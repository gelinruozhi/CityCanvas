import { create } from "zustand";
import type { Annotation, AIScore } from "@/lib/types";

const HISTORY_LIMIT = 30;

interface AnnotationStore {
  annotations: Annotation[];
  selectedId: string | null;
  isDarkMap: boolean;
  isSatellite: boolean;
  pendingPosition: { lng: number; lat: number } | null;
  isPublishOpen: boolean;
  campusCenter: { lng: number; lat: number } | null;

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

  openCreateDialog: (lng: number, lat: number) => void;
  closeCreateDialog: () => void;

  openPublishDialog: () => void;
  closePublishDialog: () => void;

  setCampusCenter: (center: { lng: number; lat: number }) => void;

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

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  annotations: [],
  selectedId: null,
  isDarkMap: true,
  isSatellite: false,
  pendingPosition: null,
  isPublishOpen: false,
  campusCenter: null,
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

  openCreateDialog: (lng, lat) => set({ pendingPosition: { lng, lat } }),
  closeCreateDialog: () => set({ pendingPosition: null }),

  openPublishDialog: () => set({ isPublishOpen: true }),
  closePublishDialog: () => set({ isPublishOpen: false }),

  setCampusCenter: (center) => set({ campusCenter: center }),

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
}));
