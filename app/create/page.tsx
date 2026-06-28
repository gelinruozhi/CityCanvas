import type { Metadata } from "next";
import { CreateClient } from "./create-client";

export const metadata: Metadata = {
  title: "创作模式 · CityCanvas",
  description: "在山东财经大学校园地图上自由打点，构建你的理想校园。",
};

export default function CreatePage() {
  return <CreateClient />;
}
