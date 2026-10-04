import io, json, math

# ===== 锚点：卫星标注图像素 → 高德实测经纬度 =====
anchors = [
    (325, 645, 117.37352, 36.67089),   # 图书馆
    (640, 800, 117.37652, 36.66968),   # 第一餐厅
    (620, 665, 117.374575, 36.667975), # 三号学生宿舍
    (250, 1010, 117.373406, 36.667666),# 四号学生公寓
]

# 最小二乘仿射：lng = a*px + b*py + c; lat = d*px + e*py + f
# 正规方程 (X^T X) w = X^T y，X = [px, py, 1]
def solve3(A, b):
    # 高斯消元 3x3
    n = 3
    M = [row[:] + [b[i]] for i, row in enumerate(A)]
    for col in range(n):
        piv = max(range(col, n), key=lambda r: abs(M[r][col]))
        M[col], M[piv] = M[piv], M[col]
        pv = M[col][col]
        for j in range(col, n + 1):
            M[col][j] /= pv
        for r in range(n):
            if r != col and M[r][col] != 0:
                f = M[r][col]
                for j in range(col, n + 1):
                    M[r][j] -= f * M[col][j]
    return [M[i][n] for i in range(n)]

X = [[p[0], p[1], 1] for p in anchors]
XtX = [[sum(X[r][i] * X[r][j] for r in range(4)) for j in range(3)] for i in range(3)]
y_lng = [sum(X[r][2] * a[2] for r in range(4)) for a in [anchors]][0] if False else [
    sum(anchors[r][2] * X[r][i] for r in range(4)) for i in range(3)
]
y_lat = [sum(anchors[r][3] * X[r][i] for r in range(4)) for i in range(3)]

a, b, c = solve3([row[:] for row in XtX], y_lng)
d, e, f = solve3([row[:] for row in XtX], y_lat)

def toLngLat(px, py):
    return (a * px + b * py + c, d * px + e * py + f)

# 验证锚点残差
print("=== 锚点残差验证 ===")
for px, py, lng0, lat0 in anchors:
    lng, lat = toLngLat(px, py)
    print(f"  ({px},{py}) → ({lng:.5f},{lat:.5f}) 误差 {math.hypot((lng-lng0)*89280, (lat-lat0)*111320):.0f}m")

# ===== 全部楼栋：卫星标注图像素位置（对照图 3 + 平面图补充） =====
buildings_px = [
    # 教学楼
    ("一号教学楼", "teaching", 165, 480, [50, 16], 5),
    ("二号教学楼", "teaching", 460, 545, [55, 16], 5),
    ("三号教学楼", "teaching", 130, 655, [50, 16], 5),
    ("四号教学楼", "teaching", 450, 730, [50, 16], 5),
    ("五号教学楼", "teaching", 430, 1135, [55, 16], 5),
    ("六号教学楼", "teaching", 630, 1370, [55, 16], 5),
    ("七号教学楼", "teaching", 450, 1370, [55, 16], 5),
    ("八号教学楼", "teaching", 640, 1480, [55, 16], 5),
    ("九号教学楼", "teaching", 430, 1480, [55, 16], 5),
    # 图书馆
    ("图书馆", "library", 325, 645, [65, 32], 5),
    # 餐厅
    ("第一餐厅", "canteen", 640, 800, [40, 25], 3),
    ("第二餐厅", "canteen", 430, 1290, [50, 30], 3),
    ("第三餐厅", "canteen", 350, 1550, [45, 28], 3),
    # A 区公寓（东北）
    ("一号学生公寓", "dorm", 600, 425, [42, 13], 6),
    ("二号学生公寓", "dorm", 625, 545, [42, 13], 6),
    ("三号学生公寓", "dorm", 620, 665, [42, 13], 6),
    # B 区公寓（西）
    ("四号学生公寓", "dorm", 250, 1010, [42, 13], 6),
    ("五号学生公寓", "dorm", 250, 1245, [42, 13], 6),
    ("教师之家", "dorm", 180, 1120, [30, 13], 4),
    # C 区公寓（南）
    ("六号学生公寓", "dorm", 700, 1680, [42, 13], 6),
    ("七号学生公寓", "dorm", 540, 1650, [42, 13], 6),
    ("八号学生公寓", "dorm", 540, 1720, [42, 13], 6),
    ("九号学生公寓", "dorm", 370, 1700, [42, 13], 6),
    ("五号学生公寓B座", "dorm", 740, 1620, [42, 13], 6),
    # 服务配套
    ("大学生活动中心", "culture", 620, 1305, [42, 26], 3),
    ("校史馆", "culture", 700, 1345, [26, 16], 2),
    ("校园超市", "store", 560, 755, [18, 12], 2),
    ("医务室", "store", 660, 175, [16, 12], 1),
    # 运动场
    ("东运动场", "field", 640, 975, [110, 72], 0),
    ("北运动场", "field", 630, 220, [95, 62], 0),
    ("西运动场", "field", 210, 1330, [80, 50], 0),
]

# ===== 画布米坐标：原点 (117.3710, 36.6725)，东西向系数 71424 m/°，南北 111320 =====
LNG0, LAT0 = 117.3710, 36.6725
out = []
for name, btype, px, py, size, floors in buildings_px:
    lng, lat = toLngLat(px, py)
    x = (lng - LNG0) * 71424
    y = (LAT0 - lat) * 111320
    out.append((name, btype, round(x), round(y), size, floors))

xs = [b[2] for b in out]
ys = [b[3] for b in out]
print(f"=== 画布包络：x {min(xs)}~{max(xs)}, y {min(ys)}~{max(ys)} ===")

# 生成 map-data 楼栋数组文本
ids = ["b1","b2","b3","b4","b5","b6","b7","b8","b9","lib","c1","c2","c3","d1","d2","d3","d4","d5","teacher","d6","d7","d8","d9","d5b","activity","museum","shop","clinic","east","north","west"]
lines = []
for i, (name, btype, x, y, size, floors) in enumerate(out):
    bid = ids[i] if i < len(ids) else f"x{i}"
    esc = name
    lines.append(f'  {{ id: "{bid}", name: "{esc}", buildingType: "{btype}", x: {x}, y: {y}, size: [{size[0]}, {size[1]}], floorCount: {floors} }},')
io.open("scripts-tmp/buildings-gen.txt", "w", encoding="utf-8").write("\n".join(lines))
print("buildings-gen.txt written")
