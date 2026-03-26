# gvctr

# gvctr.F90 - Mass Flux Vector Calculation (Rhie-Chow)

## 概述

`gvctr` 子程序使用 Rhie-Chow 插值方法计算单元面质量通量（mass flux），用于压力-速度耦合。

## 算法原理

### Rhie-Chow 插值

避免压力振荡的质量通量计算：

```fortran
rhon = w1(ijk)*rho(ijk) + (1.0-w1(ijk))*rho(ijkn)
rhou = rhon * (w1(ijk)*u(ijk) + (1.0-w1(ijk))*u(ijkn))
gi(ijkn) = rhou*(dydj*dzdk-dydk*dzdj) - rhov*(dxdj*dzdk-dxdk*dzdj) + rhow*(dxdj*dydk-dxdk*dydj)
```

其中 `w1` 是迎风权重因子。

### 网格几何

使用顶点坐标计算面积向量：

```fortran
dxdj = 0.5*((xv(ijk)-xv(ijkw))+(xv(ijkl)-xv(ijklw)))
```

## 输出参数

| 参数 | 说明 |
|------|------|
| `gi` | i 方向质量通量 |
| `gj` | j 方向质量通量 (gvctr2 计算) |
| `gk` | k 方向质量通量 (gvctr2 计算) |

## 与 gvctr3 对比

`gvctr` 仅计算 i 方向通量；`gvctr3` 计算三个方向的通量并考虑 drhodp 项（可压缩流）。

