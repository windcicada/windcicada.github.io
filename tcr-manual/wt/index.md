# wt

# wt.F90 - 网格权重计算实现子程序

## 1. 程序概述

`wt` 子程序是 `weight` 的实现，计算网格面中心的**权重因子** $w$，用于在单元中心和面中心之间进行线性插值。

## 2. 调用关系

```
weight.F90 (入口)
    └── wt(...)  ← 被 weight 调用 3 次 (i, j, k 三个方向)
```

## 3. 算法说明

### 3.1 插值原理

权重 $w$ 基于**几何位置**计算：

$$w = \frac{d_2}{d_1 + d_2}$$

其中：
- $d_1$: 单元中心到面中心的距离
- $d_2$: 相邻单元中心到面中心的距离

### 3.2 计算策略

程序采用**两套方案**：

1. **简单方案**：基于面中心和单元中心的几何距离比
2. **Newton-Raphson 方案**：基于四面体几何的精确求解（处理非结构化网格）

```fortran
! 简单方案：距离比
w1(ijk) = ds2 / (ds1 + ds2)

! Newton-Raphson 方案：迭代求解
do while (errf > tolf .and. i0 < ntrial)
  ! 构建方程组
  fvec = a0 + a1*s(1) - s(2)*a2 - s(3)*a3 - a4*s(2)*s(3)
  ! 求解修正量
  call linsol(fjac, 3, d, p)
  s = s + p
enddo
w1(ijk) = min(max(s(1), 0.0), 1.0)
```

## 4. 代码结构

```fortran
subroutine wt(iadd, jadd, kadd, l, m, n, io, jo, ko, imax, jmax, kmax, w1, &
              ibn, ibs, lower, upper, xv, yv, zv, x, y, z)
  use global, only : mout
  implicit none

  ! 变量声明
  integer :: l, m, n, imax, jmax, kmax, lower, upper
  real :: x(lower:upper), y(lower:upper), z(lower:upper)
  real :: xv(lower:upper), yv(lower:upper), zv(lower:upper)
  real :: w1(lower:upper)

  tolf = 1.0d-4  ! 收敛容差
  ntrial = 100   ! 最大迭代次数

  ! 遍历所有网格面
  do j = 1, m+1
    do k = 1, n+1

      ! 确定循环范围（考虑周期性边界）
      if (j > 1 .and. k > 1 .and. ibs(j,k) == -100) then
        istr = 0  ! 周期性入口
      else
        istr = 1
      endif

      if (j <= m .and. k <= n .and. ibn(j,k) == -100) then
        iend = l + 1  ! 周期性出口
      else
        iend = l
      endif

      do i = istr, iend
        ! ========== 计算几何量 ==========
        ! ds: 单元间距
        ! ds01-ds23: 面中心间距
        ! ds1, ds2: 到面中心的距离

        ! ========== 判断使用哪种方案 ==========
        if (退化情况) then
          ! 简单方案
          w1(ijk) = ds2 / (ds1 + ds2)
        else
          ! Newton-Raphson 方案
          ! 构建矩阵 a, 迭代求解 s
          ! w1 = 1 - s(1) (归一化)
        endif
      enddo
    enddo
  enddo
end subroutine wt
```

## 5. 关键变量

### 5.1 输入参数

| 参数 | 含义 |
|------|------|
| `iadd, jadd, kadd` | 方向偏移 |
| `l, m, n` | 网格尺寸 |
| `io, jo, ko` | 网格偏移数组 |
| `x, y, z` | 节点坐标 |
| `xv, yv, zv` | 面中心坐标 |
| `ibs, ibn` | 边界标记 |

### 5.2 输出参数

| 参数 | 含义 |
|------|------|
| `w1` | 权重因子 (方向由调用决定) |

### 5.3 内部变量

| 变量 | 含义 |
|------|------|
| `ds, ds1, ds2` | 距离量 |
| `ds01-ds23` | 面间距 |
| `a(3,0:4)` | 几何矩阵 |
| `fvec, fjac` | Newton 迭代相关 |
| `s(3)` | 迭代解 |
| `tolf` | 收敛容差 (1e-4) |
| `ntrial` | 最大迭代次数 (100) |

## 6. 边界处理

### 6.1 周期性边界

当边界标记为 `-100` (周期性) 时：
- 入口: `istr = 0` (包含 ghost 单元)
- 出口: `iend = l+1` (包含 ghost 单元)

### 6.2 退化情况

以下情况使用简单距离比方案：
- 面间距为零 (`ds01 <= 0`)
- 单元间距极小 (`ds <= 1e-4 * max(ds1, ds2)`)
- Newton 迭代不收敛

## 7. 物理说明

### 7.1 权重的作用

$$f_{face} = w \cdot f_{cell} + (1-w) \cdot f_{neighbor}$$

- $w = 0.5$: 线性插值
- $w \to 0$: 偏向邻居单元
- $w \to 1$: 偏向当前单元

### 7.2 适用范围

对于**非结构化曲线网格**，单元中心和面中心不一定共线，简单距离比可能不准确，因此使用 Newton-Raphson 求解精确权重。

## 8. 注意事项

1. **收敛检查**: 如果 Newton 迭代不收敛或解超出 [0,1]，回退到简单方案
2. **数值稳定性**: 迭代使用 `linsol` (而非注释中的 `dludcmp/dlubksb`)
3. **输出范围**: 最终权重限制在 [0, 1]

## 9. 相关文件

| 文件 | 关系 |
|------|------|
| `weight.F90` | 调用 wt 的包装程序 |
| `linsol.F90` | 线性方程组求解器 |
| `module_arrays.F90` | w1/w2/w3 数组声明 |

