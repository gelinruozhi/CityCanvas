// 校验：道路/湖/绿地/广场不压楼栋与运动场（margin >= 4）
const B = [
  ["b1",170,445,180,70],["lib",335,600,140,90],["b3",160,645,180,70],["b2",600,610,180,55],
  ["b4",555,745,160,55],["b5",575,860,170,55],["b7",590,1115,170,50],["b9",590,1240,170,50],
  ["b6",865,1145,170,50],["b8",865,1275,170,50],["dorm1",840,455,110,55],["dorm2",840,555,110,55],
  ["dorm3",840,655,110,55],["dorm4",285,760,180,55],["dorm5",285,950,180,55],["dorm7",640,1345,110,55],
  ["dorm8",640,1445,110,55],["dorm9",400,1445,110,55],["dorm6",865,1425,110,55],
  ["canteen1",935,745,130,70],["canteen2",555,975,200,80],["canteen3",390,1345,130,55],
  ["activity",880,1000,160,80],["shop",765,735,70,40],["clinic",935,255,90,50],
];
const F = [
  ["fieldE",880,855,115,58],["fieldN",900,310,105,58],["fieldW",330,1180,80,48],
];
const ROADS = [
  { pts: [[55,385],[1015,385]], width: 20 },
  { pts: [[55,385],[55,1395]], width: 20 },
  { pts: [[1015,385],[1015,1395]], width: 20 },
  { pts: [[460,150],[460,696]], width: 18 },
  { pts: [[55,696],[760,696]], width: 22 },
  { pts: [[760,698],[1015,698]], width: 14 },
  { pts: [[435,696],[435,1395]], width: 18 },
  { pts: [[55,1195],[239,1195]], width: 18 },
  { pts: [[421,1195],[1015,1195]], width: 18 },
  { pts: [[55,1395],[795,1395]], width: 18 },
  { pts: [[935,1395],[1015,1395]], width: 18 },
];
const GREENS = [[640,470,220,90],[130,950,100,100],[730,1250,80,60]];
const LAKE = [400,855,80,55], PLAZA = [460,490,38];

// 点到线段最短距离
function segDist(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
// 矩形（中心 cx,cy 半宽 hw 半高 hh）到线段的距离（各边线段取最小）
function rectSegDist(cx, cy, hw, hh, a, b) {
  const corners = [[cx-hw,cy-hh],[cx+hw,cy-hh],[cx+hw,cy+hh],[cx-hw,cy+hh]];
  let min = Infinity;
  for (let i = 0; i < 4; i++) {
    min = Math.min(min, segDist(corners[i][0], corners[i][1], a, b));
    // 边中点也要查（线段可能穿过矩形中间而端点在外）
    const nx = corners[i][0], ny = corners[i][1];
    const mx = corners[(i+1)%4][0], my = corners[(i+1)%4][1];
    min = Math.min(min, segDist((nx+mx)/2, (ny+my)/2, a, b));
  }
  // 矩形中心
  min = Math.min(min, segDist(cx, cy, a, b));
  return min;
}

let fail = 0;
for (const r of ROADS) {
  for (const [name, x, y, w, h] of [...B, ...F]) {
    const hw = w / 2, hh = h / 2;
    const d = rectSegDist(x, y, hw, hh, r.pts[0], r.pts[1]) - r.width / 2;
    if (d < 4) { console.log(`FAIL 路[${r.pts}] vs ${name}: gap=${d.toFixed(1)}`); fail++; }
  }
}
// 湖/广场/绿地 vs 楼
function ellipseRectGap(ex, ey, rx, ry, cx, cy, hw, hh) {
  const nx = Math.max(cx - hw, Math.min(ex, cx + hw));
  const ny = Math.max(cy - hh, Math.min(ey, cy + hh));
  return Math.hypot(ex - nx, ey - ny);
}
for (const [name, x, y, w, h] of B) {
  const g1 = ellipseRectGap(LAKE[0], LAKE[1], LAKE[2], LAKE[3], x, y, w/2, h/2);
  if (g1 < 4) { console.log(`FAIL 湖 vs ${name}: gap=${g1.toFixed(1)}`); fail++; }
  const g2 = ellipseRectGap(PLAZA[0], PLAZA[1], PLAZA[2], PLAZA[2], x, y, w/2, h/2);
  if (g2 < 4) { console.log(`FAIL 广场 vs ${name}: gap=${g2.toFixed(1)}`); fail++; }
  for (const [gx, gy, gw, gh] of GREENS) {
    const dx = Math.max(0, Math.abs(gx - x) - (gw/2 + w/2));
    const dy = Math.max(0, Math.abs(gy - y) - (gh/2 + h/2));
    if (Math.hypot(dx, dy) < 4) { console.log(`FAIL 绿地(${gx},${gy}) vs ${name}`); fail++; }
  }
}
for (const [gx, gy, gw, gh] of GREENS) {
  for (const [name, x, y, rx, ry] of F) {
    const dx = Math.max(0, Math.abs(gx - x) - (gw/2 + rx));
    const dy = Math.max(0, Math.abs(gy - y) - (gh/2 + ry));
    if (Math.hypot(dx, dy) < 4) { console.log(`FAIL 绿地(${gx},${gy}) vs ${name}`); fail++; }
  }
}
console.log(fail === 0 ? "ALL PASS ✓" : `${fail} FAILURES`);
