import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserStore {
  id: string | null;
  nickname: string | null;
  setUser: (id: string, nickname: string) => void;
  setNickname: (nickname: string) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      id: null,
      nickname: null,
      setUser: (id, nickname) => set({ id, nickname }),
      setNickname: (nickname) => set({ nickname }),
    }),
    {
      name: "citycanvas:user",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
