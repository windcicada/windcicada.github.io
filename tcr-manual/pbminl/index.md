# pbminl

# pbminl.F90 - 全局最小值查找

> **源文件**: `0.src.TCR.dyn728/pbminl.F90`
> **功能**: MPI 域间全局最小值归约

---

## 1. 程序概述

在所有 MPI 进程间查找全局最小值及其位置。

---

## 2. 调用方式

```fortran
call pbminl(arg, loc1, loc2, loc3, ldom)
```

### 2.1 输入参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `arg` | `real` | 待比较的值 |
| `loc1, loc2, loc3` | `real` | 位置坐标 |

### 2.2 输出参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `arg` | `real` | 全局最小值 |
| `loc1, loc2, loc3` | `real` | 最小值位置 |
| `ldom` | `integer` | 最小值所在域 |

---

## 3. 算法流程

与 `pbmaxl` 类似，但使用 `mpi_min` 操作：

### 3.1 全局最小值

```fortran
call mpi_allreduce(mpi_in_place, dummy, 1, mpi_real, mpi_min, mpi_comm_world, info)
```

---

## 4. 与 pbmaxl 对比

| 子程序 | MPI 操作 | 用途 |
|--------|----------|------|
| `pbmaxl` | `mpi_max` | 寻找最大值 |
| `pbminl` | `mpi_min` | 寻找最小值 |

---

## 5. 使用场景

- 寻找最小温度位置
- 寻找最小压力位置

---

*最后更新: 2026-03-26*


