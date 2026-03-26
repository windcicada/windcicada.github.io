# weight

# weight.F90 - 网格权重计算子程序

## 1. 程序概述

`weight` 子程序负责计算网格**权重因子** `w1, w2, w3`，用于在单元中心和面中心之间进行线性插值。

## 2. 调用关系

```
start_init.F90 / start_read.F90 (初始化阶段)
    └── weight()  ← 初始化时调用一次
```

## 3. 功能说明

### 3.1 权重定义

权重因子定义在网格面上，用于**混合中心值和面值**：

$$f_{face} = w \cdot f_{cell} + (1-w) \cdot f_{neighbor}$$

### 3.2 三个方向权重

| 权重 | 方向 | 对应面 |
|------|------|--------|
| `w1` | i 方向 | 西/东面 (x 方向) |
| `w2` | j 方向 | 南/北面 (y 方向) |
| `w3` | k 方向 | 下/上面 (z 方向) |

## 4. 代码解析

```fortran
SUBROUTINE weight
  use arrays
  use exchange
  use global

  implicit none
  integer :: iadd, jadd, kadd

  ! ========== 1. i 方向权重 w1 ==========
  iadd = io(2)
  jadd = jo(2)
  kadd = ko(2)
  call wt(iadd, jadd, kadd, l, m, n, io, jo, ko, imax, jmax, kmax, w1, &
          ibn, ibs, lower, upper, xv, yv, zv, x, y, z)

  ! ========== 2. j 方向权重 w2 ==========
  iadd = jo(2)
  jadd = ko(2)
  kadd = io(2)
  call wt(iadd, jadd, kadd, m, n, l, jo, ko, io, jmax, kmax, imax, w2, &
          ibe, ibw, lower, upper, xv, yv, zv, x, y, z)

  ! ========== 3. k 方向权重 w3 ==========
  iadd = ko(2)
  jadd = io(2)
  kadd = jo(2)
  call wt(iadd, jadd, kadd, n, l, m, ko, io, jo, kmax, imax, jmax, w3, &
          ibr, ibl, lower, upper, xv, yv, zv, x, y, z)

end subroutine weight
```

## 5. wt 子程序说明

`wt` 计算权重因子，通常基于**几何位置**：

```fortran
subroutine wt(...)
  ! 根据面坐标和单元坐标的相对位置计算权重
  ! w = (x_face - x_cell_near) / (x_cell_far - x_cell_near)
  ! 通常 w = 0.5 (线性插值)
end subroutine wt
```

### 5.1 默认值

通常 `w1 = w2 = w3 = 0.5`，即简单线性插值。

## 6. 关键变量

### 6.1 输出数组

| 变量 | 含义 | 维度 |
|------|------|------|
| `w1` | i 方向权重 | `lower:upper` |
| `w2` | j 方向权重 | `lower:upper` |
| `w3` | k 方向权重 | `lower:upper` |

### 6.2 输入参数

| 参数 | 含义 |
|------|------|
| `io, jo, ko` | 网格偏移数组 |
| `xv, yv, zv` | 面中心坐标 |
| `x, y, z` | 节点坐标 |
| `ibs, ibn, ibe, ibw, ibr, ibl` | 边界标记 |

## 7. 物理背景

### 7.1 插值必要性

在有限体积法中：
- **扩散项**: 需要单元中心的梯度 → 面中心值
- **粘度插值**: 需要从单元中心到面中心的过渡

### 7.2 权重选择

| 权重值 | 方法 | 用途 |
|--------|------|------|
| 0.5 | 线性插值 | 一般情况 |
| 0.0 | 上游值 | 纯迎风 |
| 1.0 | 下游值 | 纯下风 |

## 8. 使用位置

权重在以下位置被使用：

- `condif.F90` - 对流-扩散项离散
- `update.F90` - 速度修正
- `souru.F90` - 粘性扩散源项

## 9. 相关文件

| 文件 | 关系 |
|------|------|
| `wt.F90` | 权重计算实现 |
| `start_init.F90` | 调用 weight 的初始化程序 |
| `module_arrays.F90` | w1/w2/w3 数组声明 |

