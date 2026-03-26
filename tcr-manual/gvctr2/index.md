# gvctr2

# gvctr2.F90 - Pressure Smoothing Driver

## 概述

`gvctr2` 是压力平滑（pressure smoothing）的驱动子程序，依次对三个坐标方向调用 `d2pds`。

## 调用关系

- **调用者**: 主求解器
- **调用**: `d2pds` (三次)

## 算法流程

```fortran
! i 方向压力平滑
call d2pds(l, m, n, gi, ibn, ibs,  &
            io(2), imax, io,       &
            jo(2), jmax, jo,       &
            ko(2), kmax, ko)

! j 方向压力平滑
call d2pds(m, n, l, gj, ibe, ibw,  &
            jo(2), jmax, jo,       &
            ko(2), kmax, ko,       &
            io(2), imax, io)

! k 方向压力平滑
call d2pds(n, l, m, gk, ibr, ibl,  &
            ko(2), kmax, ko,       &
            io(2), imax, io,       &
            jo(2), jmax, jo)
```

## 参数映射

| 方向 | 输入数组 | 边界参数 |
|------|----------|----------|
| i | gi | ibn, ibs |
| j | gj | ibe, ibw |
| k | gk | ibr, ibl |

## 用途

压力平滑用于减轻压力场的非物理振荡，是 SIMPLE 算法稳定性的关键。

