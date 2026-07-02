# pbmaxl

# pbmaxl.F90 - 全局最大值查找

> **源文件**: `0.src.TCR.dyn728/pbmaxl.F90`
> **功能**: MPI 域间全局最大值归约

---

## 1. 程序概述

在所有 MPI 进程间查找全局最大值及其位置。

---

## 2. 调用方式

```fortran
call pbmaxl(arg, loc1, loc2, loc3, ldom)
```

### 2.1 输入参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `arg` | `real` | 待比较的值 |
| `loc1, loc2, loc3` | `real` | 位置坐标 |

### 2.2 输出参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `arg` | `real` | 全局最大值 |
| `loc1, loc2, loc3` | `real` | 最大值位置 |
| `ldom` | `integer` | 最大值所在域 |

---

## 3. 算法流程

### 3.1 全局最大值

```fortran
call mpi_allreduce(mpi_in_place, dummy, 1, mpi_real, mpi_max, mpi_comm_world, info)
```

### 3.2 域编号广播

```fortran
if (arg >= dummy) then
    ldom = mydom
else
    ldom = 0
endif
call mpi_allreduce(mpi_in_place, ldom, 1, mpi_integer, mpi_max, ...)
```

### 3.3 位置广播

```fortran
if (ldom == mydom) then
    loc(1) = loc1
    loc(2) = loc2
    loc(3) = loc3
else
    loc(:) = -big
endif
call mpi_allreduce(mpi_in_place, loc, 3, mpi_real, mpi_max, ...)
```

---

## 4. 使用场景

- 寻找最大温度位置
- 寻找最大压力位置
- 寻找最大速度位置

---

## 5. 类似子程序

| 子程序 | 功能 |
|--------|------|
| `pbminl` | 全局最小值查找 |
| `pbmaxl` | 全局最大值查找 |

---

*最后更新: 2026-03-26*


