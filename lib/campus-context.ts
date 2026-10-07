/**
 * 山东财经大学圣井校区已知建筑/区域清单
 * 数据源：用户提供的校园平面图（多个版本综合整理）
 * 用途：AI 评估时作为上下文，让 AI 理解校园的真实功能分布
 */
export interface CampusFacility {
  name: string;
  category:
    | "academic"     // 教学
    | "library"      // 图书馆
    | "dorm"         // 宿舍
    | "dining"       // 餐饮
    | "sports"       // 运动
    | "service"      // 服务（医务/超市/快递）
    | "culture"      // 文化活动
    | "landscape"    // 景观
    | "gate";        // 校门
  area: "north" | "south" | "east" | "west" | "center";
}

export const CAMPUS_NAME = "山东财经大学圣井校区（章丘）";
export const CAMPUS_DESCRIPTION =
  "校园整体呈南北长、东西窄的矩形布局。北门是主入口面向经十东路，东门在黄旗山一号路侧。教学区集中在北侧与中部（一号到九号教学楼 + 图书馆），生活区集中在东侧和南侧（一号到九号学生公寓 + 三个餐厅），运动区分布在三处（北、东、西运动场）。中部有镜月湖/景观湖。";

export const CAMPUS_FACILITIES: CampusFacility[] = [
  // 校门
  { name: "北门", category: "gate", area: "north" },
  { name: "东门", category: "gate", area: "east" },

  // 教学楼（按图基本排列）
  { name: "第一教学楼", category: "academic", area: "west" },
  { name: "第二教学楼", category: "academic", area: "center" },
  { name: "第三教学楼", category: "academic", area: "west" },
  { name: "第四教学楼", category: "academic", area: "center" },
  { name: "第五教学楼", category: "academic", area: "center" },
  { name: "第六教学楼", category: "academic", area: "east" },
  { name: "第七教学楼", category: "academic", area: "center" },
  { name: "第八教学楼", category: "academic", area: "east" },
  { name: "第九教学楼", category: "academic", area: "center" },

  // 图书馆
  { name: "图书馆", category: "library", area: "center" },

  // 宿舍
  { name: "第一学生公寓", category: "dorm", area: "east" },
  { name: "第二学生公寓", category: "dorm", area: "east" },
  { name: "第三学生公寓", category: "dorm", area: "east" },
  { name: "第四学生公寓", category: "dorm", area: "west" },
  { name: "第五学生公寓", category: "dorm", area: "west" },
  { name: "第六学生公寓", category: "dorm", area: "south" },
  { name: "第七学生公寓", category: "dorm", area: "south" },
  { name: "第八学生公寓", category: "dorm", area: "south" },
  { name: "第九学生公寓", category: "dorm", area: "south" },
  { name: "教师之家", category: "dorm", area: "west" },

  // 餐饮
  { name: "第一餐厅", category: "dining", area: "east" },
  { name: "第二餐厅", category: "dining", area: "center" },
  { name: "第三餐厅", category: "dining", area: "south" },

  // 运动
  { name: "北运动场", category: "sports", area: "north" },
  { name: "东运动场", category: "sports", area: "east" },
  { name: "西运动场", category: "sports", area: "west" },
  { name: "西网球场/排球场", category: "sports", area: "west" },
  { name: "北篮球场&轮滑场", category: "sports", area: "north" },

  // 服务
  { name: "校医院/医务室", category: "service", area: "north" },
  { name: "超市", category: "service", area: "east" },
  { name: "菜鸟驿站", category: "service", area: "center" },
  { name: "快递收发点", category: "service", area: "south" },

  // 文化
  { name: "文化活动中心/校史馆", category: "culture", area: "east" },

  // 景观
  { name: "镜月湖/景观湖", category: "landscape", area: "center" },
  { name: "财大花园", category: "landscape", area: "south" },
];

export const CAMPUS_CONTEXT_FOR_AI = `
${CAMPUS_NAME}

校园概况：${CAMPUS_DESCRIPTION}

主要建筑清单（按区域）：
- 北区：北门、北运动场、北篮球场&轮滑场、校医院、景观湖
- 东区：东门、东运动场、第一/二/三学生公寓、第一餐厅、超市、文化活动中心、第六/八教学楼
- 西区：第一/三教学楼、第四/五学生公寓、教师之家、西运动场、西网球/排球场
- 中部：第二/四/五/七/九教学楼、图书馆、第二餐厅、菜鸟驿站
- 南区：第三餐厅、第六/七/八/九学生公寓、快递收发点、财大花园
`.trim();
