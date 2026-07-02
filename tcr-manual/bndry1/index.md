# bndry1

# BNDRY1.F90 - 标量边界条件入口子程序

## 功能概述

`BNDRY1` 是 TCR 求解器中处理标量场边界条件的入口子程序。它是三个边界条件子程序（BNDRY1/2/3）中最基础的一个，专门处理标量变量的边界值设置。

## 调用关系

```
boffin.F90 → BNDRY1()
```

## 与 BNDRY2 的区别

| 特性 | BNDRY1 | BNDRY2 |
|------|--------|--------|
| 参数 | 无速度参数 | 传入 u,v,w 速度数组 |
| 子程序 | boundary1 | BOUNDARY2 |

## 边界处理流程

```
对 i=2 (左边界, ibs)    调用 boundary1(i, ibs, m, n, ...)
对 j=2 (下边界, ibw)    调用 boundary1(j, ibw, n, l, ...)
对 k=2 (底边界, ibl)    调用 boundary1(k, ibl, l, m, ...)
对 i=L (右边界, ibn)    调用 boundary1(i, ibn, m, n, ...)
对 j=M (上边界, ibe)    调用 boundary1(j, ibe, n, l, ...)
对 k=N (顶边界, ibr)    调用 boundary1(k, ibr, l, m, ...)
```

## 边界标记数组

| 数组 | 位置 | 说明 |
|------|------|------|
| `ibs` | i=L-1 边界 | 左边界 (South) |
| `ibn` | i=L 边界 | 右边界 (North) |
| `ibw` | j=2-1 边界 | 下边界 (West) |
| `ibe` | j=M 边界 | 上边界 (East) |
| `ibl` | k=2-1 边界 | 底边界 (Low) |
| `ibr` | k=N 边界 | 顶边界 (High) |

## 边界类型 (Marker Values)

| 值 | 类型 |
|----|------|
| 0 | 周期性 |
| -1 | 入口 |
| -2 | 出口 (零梯度) |
| -3 | 对称 |
| -4 | 壁面 (Dirichlet) |
| -40 | 壁面 (无壁函数) |
| -5 | 壁面 (Neumann) |
| -50 | 壁面 (无壁函数) |

## 相关文件

- `bndry2.F90` - 标量边界条件 (含速度)
- `bndry3.F90` - 速度分量边界
- `boundary1.F90` - 底层实现

