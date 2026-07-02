# wall v

# wall_v.F90 - 壁面速度取值子程序

## 1. 程序概述

`wall_v` 是一个函数子程序，用于从边界数组中获取壁面处的速度值。

## 2. 调用关系

```
bndry_wall.F90 (无滑移壁面边界)
    └── wall_v(nv, j, k, jmax, kmax, fsth)  ← 返回壁面速度
```

## 3. 功能说明

从预计算的边界数组 `fsth` 中直接读取壁面速度值。

## 4. 代码解析

```fortran
real function wall_v(nv, j, k, jmax, kmax, fsth)
  use global, only : nmax, mout

  implicit none
  integer :: j, k, jmax, kmax, nv
  real :: fsth(nmax+3, jmax, kmax)

  wall_v = fsth(nv, j, k)

  return
end function wall_v
```

## 5. 关键变量

### 5.1 输入参数

| 参数 | 含义 |
|------|------|
| `nv` | 速度分量索引 (1=U, 2=V, 3=W) |
| `j, k` | 网格索引 |
| `jmax, kmax` | 网格尺寸 |
| `fsth` | 边界速度数组 |

### 5.2 输出

| 参数 | 含义 |
|------|------|
| `wall_v` | 壁面速度值 |

## 6. 与 slip_v 的对比

| 函数 | 用途 | 方法 |
|------|------|------|
| `slip_v` | 自由滑移边界 | 一阶外推 |
| `wall_v` | 无滑移壁面 | 直接读取 |

## 7. 相关文件

| 文件 | 关系 |
|------|------|
| `bndry_wall.F90` | 调用 wall_v 的壁面处理 |
| `slip_v.F90` | 滑移边界外推 |

