# bndry NSCBC

# bndry_NSCBC.F90

## 功能概述
NSCBC（Navier-Stokes Characteristics Boundary Conditions）边界条件的 wrapper 子程序。对六个计算域边界（X±, Y±, Z±）调用 `boundary_NSCBC`，应用基于特征线的边界处理方法。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `bndry_NSCBC` | 主子程序，调用 6 个 boundary_NSCBC 实例 |

## 边界调用映射

| 方向 | 边界标记 | 数组 | i/j/k 索引 |
|------|----------|------|------------|
| -X | ibs | fsth | i=2 |
| -Y | ibw | fwst | j=2 |
| -Z | ibl | flft | k=2 |
| +X | ibn | fnth | i=l |
| +Y | ibe | fest | j=m |
| +Z | ibr | frht | k=n |

## NSCBC 方法概述
NSCBC 基于特征线理论，将边界条件分为：
- **入口**：给定 Riemann 不变量
- **出口**：给定压力或特征速度
- **壁面**：无滑移或滑移条件
- **对称**：法向速度为零

## 依赖模块
- `arrays`：边界标记 (ibs, ibw, ibl, ibn, ibe, ibr)
- `global`：网格信息 (imax, jmax, kmax, io, jo, ko)

