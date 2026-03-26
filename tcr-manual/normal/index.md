# normal

# normal.F90 - 单元面法向量与切向量计算子程序

## 1. 程序概述

`normal` 子程序计算网格单元面的**法向量** $(n_x, n_y, n_z)$ 和**切向量** $(t_x, t_y, t_z)$，用于：
- 边界条件处理
- 数字湍流数据插值
- 坐标变换度规计算

## 2. 调用关系

```
profile.F90 (数字湍流数据插值)
    └── normal(...)  ← 计算插值系数
weight.F90 / wt.F90 (权重计算)
    └── normal(...)  ← 辅助计算
```

## 3. 功能说明

### 3.1 计算内容

| 向量 | 用途 |
|------|------|
| $(n_x, n_y, n_z)$ | 面法向（归一化） |
| $(t_x, t_y, t_z)$ | 面切向（与度规方向相关） |
| $deta1, deta2, deta3$ | 坐标变换度规导数 |

### 3.2 调用方式

程序支持三个方向的六个面：

```fortran
! i - 1/2 面
call normal(i, j, k, +io(2), imax, io, jo(2), jmax, jo, ko(2), kmax, ko)

! i + 1/2 面
call normal(i, j, k, -io(2), imax, io, jo(2), jmax, jo, ko(2), kmax, ko)

! j - 1/2 面
call normal(j, k, i, +jo(2), jmax, jo, ko(2), kmax, ko, io(2), imax, io)

! ... 其他类似
```

## 4. 代码解析

```fortran
subroutine normal(i, j, k, iadd, imax, io, jadd, jmax, jo, kadd, kmax, ko)
  use arrays, only : x, y, z, xv, yv, zv
  use global, only : mout, pi
  use extras

  implicit none
  integer :: imax, jmax, kmax
  integer :: i, j, k, ijk, ijk0, ijks, ijkw, ijkl, ijklw
  integer :: iadd, jadd, kadd
  integer :: io(0:imax), jo(0:jmax), ko(0:kmax)

  real :: dxdi, dydi, dzdi, dxdj, dxdk, dydj, dydk, dzdj, dzdk
  real :: ajp, ds, normsign, tangent_sign
  real :: a(3,3), t1, t2, t3, theta, cos_a, sin_a

  ! ========== 1. 计算网格索引 ==========
  ijk = 1 + io(i) + jo(j) + ko(k)
  ijks = ijk - iadd
  if (iadd > 0) then
    ijk0 = ijk - iadd
  else
    ijk0 = ijk
  endif
  ijkw = ijk0 - jadd
  ijkl = ijk0 - kadd
  ijklw = ijkl - jadd

  ! ========== 2. 计算坐标导数 ==========
  dxdi = x(ijk) - x(ijks)
  dydi = y(ijk) - y(ijks)
  dzdi = z(ijk) - z(ijks)

  ! 中心差分
  dxdj = 0.5 * ((xv(ijk0) - xv(ijkw)) + (xv(ijkl) - xv(ijklw)))
  dydj = 0.5 * ((yv(ijk0) - yv(ijkw)) + (yv(ijkl) - yv(ijklw)))
  dzdj = 0.5 * ((zv(ijk0) - zv(ijkw)) + (zv(ijkl) - zv(ijklw)))

  dxdk = 0.5 * ((xv(ijk0) - xv(ijkl)) + (xv(ijkw) - xv(ijklw)))
  dydk = 0.5 * ((yv(ijk0) - yv(ijkl)) + (yv(ijkw) - yv(ijklw)))
  dzdk = 0.5 * ((zv(ijk0) - zv(ijkl)) + (zv(ijkw) - zv(ijklw)))

  ! ========== 3. 法向量计算 ==========
  deta1dx = (dydj * dzdk - dydk * dzdj)
  deta1dy = -(dxdj * dzdk - dxdk * dzdj)
  deta1dz = (dxdj * dydk - dxdk * dydj)

  da = sqrt(deta1dx**2 + deta1dy**2 + deta1dz**2)
  nx = deta1dx / da
  ny = deta1dy / da
  nz = deta1dz / da

  ! ========== 4. Jacobian 和度规 ==========
  ajp = dxdi * (dydj * dzdk - dydk * dzdj) &
      - dxdj * (dydi * dzdk - dydk * dzdi) &
      + dxdk * (dydi * dzdj - dydj * dzdi)

  ! 归一化度规
  deta1dx = deta1dx / ajp
  deta1dy = deta1dy / ajp
  deta1dz = deta1dz / ajp
  ! ... deta2, deta3 类似

  ! ========== 5. 切向量计算 ==========
  ds = sqrt(dxdj**2 + dydj**2 + dzdj**2)
  sx = dxdj / ds
  sy = dydj / ds
  sz = dzdj / ds

  ds = sqrt(dxdk**2 + dydk**2 + dzdk**2)
  t1 = dxdk / ds
  t2 = dydk / ds
  t3 = dzdk / ds

  ! 旋转矩阵 (绕法向量旋转 90°)
  theta = 0.5 * pi
  cos_a = cos(theta)
  sin_a = sin(theta)
  ! ... 构建旋转矩阵 a

  tx = a(1,1) * sx + a(1,2) * sy + a(1,3) * sz
  ty = a(2,1) * sx + a(2,2) * sy + a(2,3) * sz
  tz = a(3,1) * sx + a(3,2) * sy + a(3,3) * sz

  ! 校正切向量方向
  tangent_sign = sign(1.0, (tx * dxdk + ty * dydk + tz * dzdk) * (t1 * dxdk + t2 * dydk + t3 * dzdk))
  tx = tangent_sign * tx
  ty = tangent_sign * ty
  tz = tangent_sign * tz

  ! ========== 6. 校正法向量方向 ==========
  normsign = sign(1.0, nx * dxdi + ny * dydi + nz * dzdi)
  nx = normsign * nx
  ny = normsign * ny
  nz = normsign * nz

end subroutine normal
```

## 5. 关键变量

### 5.1 输出变量 (extras 模块)

| 变量 | 含义 |
|------|------|
| `nx, ny, nz` | 面法向量 (归一化) |
| `tx, ty, tz` | 面切向量 |
| `sx, sy, sz` | 临时切向量 (j 方向) |
| `deta1dx, deta1dy, deta1dx` | 度规导数 |
| `deta2dx, deta2dy, deta2dz` | 度规导数 |
| `deta3dx, deta3dy, deta3dz` | 度规导数 |

### 5.2 输入参数

| 参数 | 含义 |
|------|------|
| `i, j, k` | 网格索引 |
| `iadd, jadd, kadd` | 方向偏移 (+/- io(2), jo(2), ko(2)) |
| `x, y, z` | 节点坐标 |
| `xv, yv, zv` | 面中心坐标 |

## 6. 算法说明

### 6.1 法向量计算

$$\mathbf{n} = \frac{\mathbf{e}_\xi \times \mathbf{e}_\eta}{|\mathbf{e}_\xi \times \mathbf{e}_\eta|}$$

其中：
- $\mathbf{e}_\xi = (\partial x/\partial \xi, \partial y/\partial \xi, \partial z/\partial \xi)$
- $\mathbf{e}_\eta = (\partial x/\partial \eta, \partial y/\partial \eta, \partial z/\partial \eta)$

### 6.2 度规导数

$$d\eta_1^j = \frac{\partial \xi^j}{\partial x_i}$$

归一化后用于坐标变换。

## 7. 物理说明

### 7.1 法向量方向

程序确保法向量指向**单元内部**（与坐标增加方向一致）：

```fortran
normsign = sign(1.0, nx * dxdi + ny * dydi + nz * dzdi)
```

### 7.2 切向量正交

切向量通过旋转矩阵从 j 方向旋转 90° 得到，确保与法向量正交。

## 8. 注意事项

1. **循环调用**: 需要对三个方向六个面分别调用
2. **度规输出**: 结果存储在 extras 模块的全局变量中
3. **除零保护**: `da = 0` 时输出警告

## 9. 相关文件

| 文件 | 关系 |
|------|------|
| `profile.F90` | 使用 normal 进行插值 |
| `wt.F90` | 使用 normal 计算权重 |
| `module_extras.F90` | 度规变量模块 |

