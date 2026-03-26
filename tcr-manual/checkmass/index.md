# checkmass

# checkmass.F90

## 功能概述
检查并修正质量分数守恒。确保所有随机场中各网格点的物种质量分数之和为 1（归一化）。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `checkmass` | 质量分数归一化检查 |

## 算法描述

### 1. 质量守恒修正
对于每个随机场和每个网格点：
```fortran
summ = sum(yn * wm)  ! 加权摩尔质量总和
! 归一化：调整 N2 使得总和为 1
yn(N2) = (1.0 - (summ - yn(N2)*wm(N2))) / wm(N2)
```

### 2. 误差计算
```fortran
error = max(error, abs(1.0 - summ))
```

### 3. MPI 归约
使用 `mpi_allreduce` 获取全局最大误差：
```fortran
call mpi_allreduce(..., error, mpi_max, ...)
```

### 4. 输出
输出最大质量误差到屏幕。

## 关键变量
| 变量 | 说明 |
|------|------|
| `error` | 质量守恒误差 |
| `yn` | 物种摩尔分数（临时数组） |
| `wm` | 物种分子量 |

## 依赖模块
- `arrays`：流场数组 f
- `chemistry`：物种信息 (yn, wm, nsp, names)
- `exchange`：MPI 通信
- `sgs_pdf`：随机场数 nfield

