const ADJECTIVES = [
  "打盹的", "爱笑的", "迷路的", "悠闲的", "认真的", "调皮的", "好奇的",
  "贪吃的", "勇敢的", "懒散的", "腼腆的", "热心的", "聪明的", "孤独的",
  "温柔的", "倔强的", "深夜的", "晴天的", "微醺的", "走神的",
];

const ANIMALS = [
  "小鹿", "猫头鹰", "海豚", "树懒", "水獭", "柴犬", "企鹅", "考拉",
  "刺猬", "兔子", "松鼠", "狐狸", "灰鲸", "麋鹿", "鲸鱼", "羊驼",
  "海星", "猞猁", "海象", "锦鲤",
];

export function generateRandomNickname(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const b = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${a}${b}`;
}
