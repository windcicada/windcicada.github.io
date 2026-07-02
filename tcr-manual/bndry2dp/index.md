# bndry2dp

# bndry2dp.F90

## 功能概述
处理压力修正方程 (DP) 的 Neumann 边界条件，并计算净质量流量。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `bndry2dp` | 压力修正边界 + 质量流量计算 |

## 算法描述

### 1. 压力修正边界
对六个面调用 `boundary2_dp`，传入：
- `sc/nc`：X方向系数
- `wc/ec`：Y方向系数  
- `lc/rc`：Z方向系数

### 2. 质量流量统计
```fortran
flow  = 0.0    ! 净质量流量
floin = 0.0    ! 入口质量流量
flout = 0.0    ! 出口质量流量
```

通过面积分计算各面的质量流量，用于监测计算稳定性。

## 输出变量
- `flow`：净质量流量
- `floin`：总入口流量
- `flout`：总出口流量

## 依赖模块
- `arrays`：系数数组 (sc, nc, wc, ec, lc, rc)、边界标记
- `global`：网格几何 (gi, gj, gk)
- `exchange`：MPI 通信

