# ewt

# ewt.F90 - Error Weight Normalization

## 概述

`ewt` 子程序计算各变量的误差权重范数（error weight normalization），用于收敛判据和残差归一化。

## 调用关系

- **调用者**: `boffin.F90` 主程序
- **使用模块**: `arrays`, `exchange`, `global`

## 算法原理

### 压力变量范数

压力采用平均二范数：

```fortran
rnorm(nvdp) = Σ(ρ²) / N_cells
```

### 其他变量范数

其他变量采用最大范数：

```fortran
rnorm(nv) = max((ρ * f)²)
```

### 速度范数统一

```fortran
vnorm = rnorm(nvu) + rnorm(nvv) + rnorm(nvw)
rnorm(nvu) = vnorm
rnorm(nvv) = vnorm
rnorm(nvw) = vnorm
```

### 时间归一化

最终范数除以物理时间：

```fortran
rnorm(nv) = sqrt(rnorm(nv)) / rtime
```

## 关键变量

| 变量 | 说明 |
|------|------|
| `rnorm` | 各变量的误差权重 |
| `rtime` | 物理模拟时间 |
| `small` | 最小值防止除零 |

## MPI 并行

- 压力: `MPI_SUM` 归约
- 其他变量: `MPI_MAX` 归约

## 用途

- 收敛判据计算
- 残差归一化
- 迭代监控

