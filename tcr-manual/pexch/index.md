# pexch

# pexch.F90 - 压力广播

> **源文件**: `0.src.TCR.dyn728/pexch.F90`
> **功能**: 将压力修正值广播到所有 MPI 进程

---

## 1. 程序概述

将指定域的压力修正值 `dp` 广播到所有进程，确保压力场一致性。

---

## 2. 调用方式

```fortran
call pexch(dp)
```

### 2.1 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `dp` | `real, intent(inout)` | 压力修正值数组 |

---

## 3. 算法流程

### 3.1 MPI 广播

```fortran
! 广播 ijkref 位置的压力修正值
call mpi_bcast(dp(ijkref), 1, mpi_real, tid(dprefdom), mpi_comm_world, info)

! 同步所有进程
call mpi_barrier(mpi_comm_world, info)
```

### 3.2 广播源

- **源进程**: `tid(dprefdom)` - 首选域对应的进程
- **广播内容**: `dp(ijkref)` - 参考单元的压力修正值

---

## 4. 关键变量

| 变量 | 说明 |
|------|------|
| `ijkref` | 参考单元索引 |
| `dprefdom` | 压力参考域 |

---

## 5. 使用场景

在压力修正方程求解后，确保所有域使用一致的压力修正值。

---

*最后更新: 2026-03-26*


