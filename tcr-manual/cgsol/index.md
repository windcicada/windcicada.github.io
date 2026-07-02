# cgsol

# CGSOL.F90 - PCG 压力求解器

## 功能概述

`CGSOL` 是 TCR 求解器中的 **预处理共轭梯度 (PCG) 求解器**，专门用于求解压力泊松方程。该求解器使用 **ICCG(1,1,1)** 方法（不完全乔莱斯基分解预处理器），适用于对称正定矩阵。

## 算法参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 预处理器 | ICCG(1,1,1) | 不完全乔莱斯基分解 |
| 收敛条件 | `error > tol(nv)` | 相对残差 |
| 最大迭代 | `icycl(nv)` | 最大迭代次数 |
| 向量化 | 可选对角预处理器 | 备选方案 |

## 算法流程

### 1. 系数矩阵缩放
```fortran
coef(sc,ijk) = coef(sc,ijk)*dvol
coef(nc,ijk) = coef(nc,ijk)*dvol
...
coef(pc,ijk) = coef(pc,ijk)*dvol
r(ijk) = coef(bpc,ijk)*dvol
```

### 2. 不完全乔莱斯基分解 (IC)
```fortran
d(ijk) = coef(pc,ijk) - d(ijkw)*coef(wc,ijk)**2 &
                       - d(ijks)*coef(sc,ijk)**2 &
                       - d(ijkl)*coef(lc,ijk)**2
d(ijk) = 1.0/d(ijk)
```

### 3. PCG 迭代循环

```
while (error > tol 且 ncycl < icycl)
    ├── 下三角求解 (Forward sweep)
    ├── 对角缩放
    ├── 上三角求解 (Backward sweep)
    ├── 计算步长 α
    ├── 更新搜索方向 p
    ├── MPI 通信 (pbsrhl)
    └── 计算残差
```

### 4. 收敛判断
```fortran
error = err / rnorm(nv)
```

## 关键变量

| 变量 | 类型 | 用途 |
|------|------|------|
| `a` | 工作数组 | 临时向量 |
| `d` | 对角预处理器 | ICC 分解结果 |
| `p` | 搜索方向 | PCG 搜索方向 |
| `r` | 残差向量 | 当前残差 |
| `rnorm(nv)` | 范数 | 参考残差范数 |
| `tol(nv)` | 容差 | 收敛容差 |

## 矩阵系数索引

| 索引 | 方向 | 说明 |
|------|------|------|
| `sc` | i-1 | 南/左系数 |
| `nc` | i+1 | 北/右系数 |
| `wc` | j-1 | 西/下系数 |
| `ec` | j+1 | 东/上系数 |
| `lc` | k-1 | 下系数 |
| `rc` | k+1 | 上系数 |
| `pc` | 对角 | 主系数 |
| `bpc` | - | 右端项 |

## 错误处理

- **负对角元**: 当 `d(ijk) <= 0` 时报错终止
- **MPI 归约**: 所有进程同步最大残差

## 与 CGSTAB 的区别

| 特性 | CGSOL | CGSTAB |
|------|-------|--------|
| 算法 | PCG + ICCG | Bi-CGSTAB + ILU |
| 适用 | 对称正定矩阵 | 非对称矩阵 |
| 主要用途 | 压力泊松方程 | 动量方程 |

## 调用链

```
boffin.F90
  └→ press.F90 (构建压力方程系数)
       └→ cgsol.F90 (求解压力方程)
```

## 性能特点

- **内存**: 需要 4 个额外工作数组 (a, d, p, r)
- **通信**: 每次迭代需要 MPI 全局归约
- **收敛**: 通常 10-50 次迭代收敛

## 备选向量化方案

1. **对角预处理器**: 用对角预处理器替代 ICC
2. **截断展开**: 使用 Van der Vorst 的 L-D-U 截断展开

