# bndry3crn

# bndry3crn.F90

## 功能概述
处理网格边缘（corner/edge）单元的边界条件。由于三维网格的角点同时属于多个边界面，需要特殊处理。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `bndry3crn` | 边缘/角点边界处理 |

## 算法描述

### 边缘类型（共12条边）

**X方向边（4条）**：
- (i=1, j=1, k=2:n) - X- Y- Z面交线
- (i=1, j=mp1, k=2:n) - X- Y+ Z面交线
- (i=lp1, j=1, k=2:n) - X+ Y- Z面交线
- (i=lp1, j=mp1, k=2:n) - X+ Y+ Z面交线

**Y方向边（4条）**：
- (i=2:n, j=1, k=1) - X Y- Z- 交线
- (i=2:n, j=1, k=np1) - X Y- Z+ 交线
- (i=2:n, j=mp1, k=1) - X Y+ Z- 交线
- (i=2:n, j=mp1, k=np1) - X Y+ Z+ 交线

**Z方向边（4条）**：
- (i=1, j=2:n, k=1) - X- Y Z- 交线
- ...（类似）

### 处理逻辑
对每条边，调用 `boundary_edge` 传入两个边界标记（corner 处可能冲突），由 `boundary_edge` 内部解决优先级。

## 依赖模块
- `arrays`：边界标记 (ibs, ibn, ibw, ibe, ibl, ibr)
- `global`：网格尺寸 (imax, jmax, kmax, lp1, mp1, np1)

