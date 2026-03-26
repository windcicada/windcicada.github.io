# courant

# courant.F90

## 功能概述
计算 CFL 数、扩散数和 Peclet 数，用于评估数值稳定性并调整时间步长。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `courant` | 稳定性参数计算 |

## 算法描述

### 1. 扩散数 (Diffusion Number)
```fortran
tip = |b11 * gam / (rho * ajc)| * dtim
diffnum = max(diffnum, tip)
```

### 2. CFL 数 (Courant Number)
```fortran
cou = dtim * |max(|gi|, |gi邻居|)| / (rho * ajc)
```

### 3. Peclet 数
```fortran
pec = cou / diffnum
```

## 输出变量
| 变量 | 维度 | 说明 |
|------|------|------|
| `cou` | 3 | X/Y/Z 方向的 CFL 数 |
| `diffnum` | 3 | X/Y/Z 方向的扩散数 |
| `pec` | 3 | X/Y/Z 方向的 Peclet 数 |

## MPI 归约
使用 `mpi_allreduce` 获取全局最大值。

## 稳定性准则
- CFL < 1.0（对流稳定）
- 扩散数 < 0.5（扩散稳定）
- Peclet 数反映对流与扩散的相对强度

## 依赖模块
- `arrays`：几何量 (ajc, b11, b22, b33)、密度 rho
- `exchange`：MPI 通信
- `global`：网格尺寸 (l, m, n)、时间步 dtim

