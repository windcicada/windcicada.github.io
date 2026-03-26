# souru

# souru.F90 - 动量方程粘性扩散源项子程序

## 1. 程序概述

`souru` 子程序计算动量方程中的**粘性扩散源项**，即速度梯度与有效粘度乘积的散度：

$$\nabla \cdot (\mu_{eff} \nabla u_i)$$

该子程序是湍流燃烧求解器中动量方程离散的关键组成部分。

## 2. 调用关系

```
boffin.F90 (主循环)
    └── souru(dpdx, u, x, xv, v, y, yv, w, z, zv)  ← 动量方程构建
```

## 3. 功能说明

### 3.1 核心计算

计算粘性扩散项的体积分：

$$S_{visc,i} = \int_{\Omega} \nabla \cdot (\mu_{eff} \nabla u_i) \, d\Omega$$

展开为三个方向的分量：
- $\frac{\partial}{\partial \xi_1} (\Gamma \frac{\partial u}{\partial \xi_1})$
- $\frac{\partial}{\partial \xi_2} (\Gamma \frac{\partial u}{\partial \xi_2})$
- $\frac{\partial}{\partial \xi_3} (\Gamma \frac{\partial u}{\partial \xi_3})$

### 3.2 压力梯度项

同时处理压力梯度源项：

```fortran
coef(bpc,ijk) = coef(bpc,ijk) - dpdx(ijk)
```

## 4. 算法说明

### 4.1 坐标变换

程序在**曲线坐标系** $(\xi_1, \xi_2, \xi_3)$ 中处理，度规导数通过坐标差分计算：

```fortran
! 度规计算
deta1dx = (dydj*dzdk - dydk*dzdj) / ajp
deta2dx = -(dydi*dzdk - dydk*dzdi) / ajp
deta3dx = (dydi*dzdj - dydj*dzdi) / ajp
```

### 4.2 速度梯度

使用**二阶中心差分**计算速度梯度：

```fortran
! 内部单元（中心差分）
dxdi = 0.5 * (x(ijkn) - x(ijks))
dudi = 0.5 * (u(ijkn) - u(ijks))

! 边界单元（一阶差分）
dxdi = x(ijkn) - x(ijk)
dudi = u(ijkn) - u(ijk)
```

### 4.3 通量计算

```fortran
! 北向通量
north = ajn * (dudxn * deta1dx + dvdxn * deta1dy + dwdxn * deta1dz) * gamn

! 源项累加
coef(bpc, ijk) = coef(bpc, ijk) + (north - south) / ajc(ijk)
```

## 5. 代码结构

```fortran
subroutine souru(dpdx, u, x, xv, v, y, yv, w, z, zv)
  use arrays, only : io, jo, ko, w1, w2, w3, gam, ajc, coef, nfo, work, rho
  use exchange
  use extras
  use global, only : ...

  ! 指针定义
  dudx => assign_pointer(work(lower+nfo(1)), lower, upper)
  dvdx => assign_pointer(work(lower+nfo(2)), lower, upper)
  dwdx => assign_pointer(work(lower+nfo(3)), lower, upper)

  ! ========== 1. 压力梯度源项 ==========
  do k = 2, n
    do j = 2, m
      jk = jo(j) + ko(k)
      do i = 2, l
        ijk = 1 + io(i) + jk
        coef(bpc, ijk) = coef(bpc, ijk) - dpdx(ijk)
      enddo
    enddo
  enddo

  ! ========== 2. 计算速度梯度 ==========
  ! ... (三方向梯度计算)

  ! ========== 3. Halo 通信 ==========
  call pbsrhl(dudx, 1)
  call pbsrhl(dvdx, 1)
  call pbsrhl(dwdx, 1)

  ! ========== 4. i 方向粘性通量 ==========
  ! ... (north-south 通量差)

  ! ========== 5. j 方向粘性通量 ==========
  ! ... (east-west 通量差)

  ! ========== 6. k 方向粘性通量 ==========
  ! ... (right-left 通量差)

end subroutine souru
```

## 6. 关键变量

### 6.1 输入参数

| 参数 | 含义 |
|------|------|
| `dpdx` | 压力梯度 $\partial p/\partial x$ |
| `u, v, w` | 速度分量 |
| `x, y, z` | 节点坐标 |
| `xv, yv, zv` | 面中心坐标 |

### 6.2 内部数组

| 变量 | 含义 |
|------|------|
| `dudx, dvdx, dwdx` | 速度在 x 方向的偏导数 |
| `gamn, game, gamr` | 各方向的扩散系数 |

### 6.3 网格量

| 变量 | 含义 |
|------|------|
| `ajc` | 单元 Jacobian |
| `ajn, aje, ajr` | 各面的 Jacobian |
| `w1, w2, w3` | 网格权重因子 |

## 7. 物理说明

### 7.1 有效粘度

$$\mu_{eff} = \mu_{mol} + \mu_{SGS}$$

- 分子粘度 $\mu_{mol}$: 通过粘度模型计算
- SGS 粘度 $\mu_{SGS}$: 通过亚格子模型计算

### 7.2 湍流扩散

粘性扩散项在湍流中扮演重要角色，湍流粘度远大于分子粘度，使得动量传输远强于层流。

## 8. 并行通信

```fortran
! 速度梯度需要边界数据，需同步 Ghost 区域
call pbsrhl(dudx, 1)
call pbsrhl(dvdx, 1)
call pbsrhl(dwdx, 1)
```

## 9. 注意事项

1. **网格权重**：使用 `w1, w2, w3` 在单元中心和面中心间插值
2. **度规奇点**：边界处使用一阶差分避免奇点
3. **小量保护**： Jacobian 加小量防止除零

## 10. 相关文件

| 文件 | 关系 |
|------|------|
| `condif.F90` | 对流-扩散系数构建 |
| `gradient.F90` | 梯度计算 |
| `viscos.F90` | 粘度计算 |
| `boffin.F90` | 调用 souru 的主程序 |

