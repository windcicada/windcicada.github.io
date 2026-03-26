# slip v

# slip_v.F90 - 滑移速度外推子程序

## 1. 程序概述

`slip_v` 是一个函数子程序，用于通过**一阶外推**计算滑移边界（自由滑移/对称边界）处的速度值。

## 2. 调用关系

```
bndry3.F90 (自由滑移边界条件)
    └── slip_v(nv, ijk, iadd)  ← 返回外推值
```

## 3. 功能说明

### 3.1 外推方法

使用一阶线性外推：

$$u_{slip} = u_{near} - \frac{\partial u}{\partial n} \cdot d$$

其中：
- $u_{near}$: 临近单元的速度值
- $\partial u / \partial n$: 速度法向梯度
- $d$: 壁面到临近单元的距离

## 4. 代码解析

```fortran
real function slip_v(nv, ijk, iadd)
  use arrays, only : nfo, f, x, y, z

  implicit none
  integer :: ijk, ijkp, ijks, ijkn, nv, iadd
  real :: ds, dsp, dfds

  ! 计算壁面到临近单元的距离
  ijkn = ijk + iadd      ! 壁面相邻单元
  ijks = ijk - iadd      ! 下一单元（用于外推）

  ds = sqrt((x(ijkn)-x(ijk))**2 + (y(ijkn)-y(ijk))**2 + (z(ijkn)-z(ijk))**2)
  dsp = sqrt((x(ijk)-x(ijks))**2 + (y(ijk)-y(ijks))**2 + (z(ijk)-z(ijks))**2)

  ! 计算速度梯度
  ijkp = ijk + nfo(nv)           ! 变量偏移
  ijkn = ijkn + nfo(nv)          ! 相邻单元偏移
  dfds = (f(ijkn) - f(ijkp)) / ds

  ! 一阶外推
  slip_v = f(ijkp) - dfds * dsp

  return
end function slip_v
```

## 5. 关键变量

### 5.1 输入参数

| 参数 | 含义 |
|------|------|
| `nv` | 变量索引 (速度分量) |
| `ijk` | 网格单元索引 |
| `iadd` | 方向偏移 (+/- io(2), jo(2), ko(2)) |

### 5.2 内部变量

| 变量 | 含义 |
|------|------|
| `ijkn` | 壁面相邻单元索引 |
| `ijks` | 第二层单元索引 |
| `ds` | 壁面到相邻单元距离 |
| `dsp` | 相邻单元到第二层距离 |
| `dfds` | 速度梯度 |

## 6. 物理说明

### 6.1 自由滑移边界

对于自由滑移（对称）边界：
- 法向速度为零
- 切向速度梯度为零（理想情况）
- 通过外推得到壁面速度

### 6.2 一阶外推

假设速度在靠近壁面的区域内线性分布，通过相邻两点的值外推壁面处的值。

## 7. 使用场景

- `bndry3.F90` - 自由滑移边界处理
- 其他需要滑移条件的边界类型

## 8. 相关文件

| 文件 | 关系 |
|------|------|
| `bndry3.F90` | 调用 slip_v 的边界处理 |
| `wall_v.F90` | 无滑移壁面速度计算 |

