# wall

# wall.F90 - 壁面律计算子程序

## 1. 程序概述

`wall` 子程序使用**壁面律**（Law of the Wall）计算固体壁面处的**有效粘度**，用于无滑移壁面边界条件的处理。

## 2. 调用关系

```
bndry_wall.F90 (壁面边界条件)
    └── wall(u, y, visco, rho, gamw)  ← 计算壁面有效粘度
```

## 3. 功能说明

### 3.1 壁面律公式

对于高雷诺数湍流边界层，靠近壁面的速度分布满足：

$$U^+ = \frac{1}{\kappa} \ln(y^+) + B$$

其中：
- $U^+ = U / u_\tau$ (无量纲速度)
- $y^+ = y u_\tau / \nu$ (无量纲距离)
- $\kappa = 0.40$ (冯·卡门常数)
- $B = 5.50$ (常数)

### 3.2 适用范围

仅当 $y^+ > 10.6$ 时使用壁面律，否则使用分子粘度：

```fortran
if (rho * utau * y / visco > 10.6) then
  ! 使用壁面律
else
  ! 使用分子粘度
endif
```

## 4. 代码解析

```fortran
SUBROUTINE WALL(U, Y, VISCO, RHO, GAMW)
  use global, only : mout

  implicit none
  integer :: iter
  real :: U, Y, VISCO, RHO, GAMW, S, DS, FUN, RE, TAU, UTAU
  real, save :: CAPPA = 0.40, B = 5.50

  ! ========== 1. 默认使用分子粘度 ==========
  gamw = visco

  ! ========== 2. 计算摩擦速度和壁面剪切应力 ==========
  tau = visco * u / y
  utau = sqrt(tau / rho)

  ! ========== 3. 判断是否使用壁面律 ==========
  if (rho * utau * y / visco > 10.6) then
    ! 计算雷诺数
    re = rho * u * y / visco
    s = utau / u  ! 初始猜测 s = U+^-1

    ! ========== 4. Newton 迭代求解 ==========
    do iter = 1, 10
      fun = s * (b + log(re * s) / cappa)
      ds = cappa * (1.0 - fun) / (1.0 + cappa * fun / s)
      s = s + ds

      ! 收敛检查
      if (s <= 0.0) then
        write(mout, *) 'wall law - s less than zero'
        call boffin_stop(__FILE__, __LINE__)
      endif
      if (abs(ds) < s * 1.0e-5) then
        goto 20
      endif
    enddo

    ! 迭代失败处理
    write(mout, *) 'wall law - convergence failure'
    call boffin_stop(__FILE__, __LINE__)

20  continue

    ! ========== 5. 计算壁面剪切应力和有效粘度 ==========
    tau = rho * (u * s)**2
    gamw = tau * y / u
  endif

end subroutine wall
```

## 5. 关键变量

### 5.1 输入参数

| 参数 | 含义 | 单位 |
|------|------|------|
| `U` | 壁面平行速度 | m/s |
| `Y` | 到壁面的距离 | m |
| `VISCO` | 分子动力粘度 | Pa·s |
| `RHO` | 密度 | kg/m³ |

### 5.2 输出参数

| 参数 | 含义 |
|------|------|
| `GAMW` | 壁面有效粘度 |

### 5.3 内部变量

| 变量 | 含义 |
|------|------|
| `tau` | 壁面剪切应力 |
| `utau` | 摩擦速度 $u_\tau = \sqrt{\tau/\rho}$ |
| `re` | 雷诺数 $Re = \rho u y / \mu$ |
| `s` | $u/U^+$ 比值 |
| `CAPPA` | 冯·卡门常数 $\kappa = 0.40$ |
| `B` | 壁面常数 $B = 5.50$ |

## 6. 算法说明

### 6.1 迭代求解

从壁面律公式推导得到关于 $s$ 的隐式方程：

$$f(s) = s \left( B + \frac{\ln(Re \cdot s)}{\kappa} \right) - 1 = 0$$

使用 Newton 法求解：

$$s_{new} = s - \frac{f(s)}{f'(s)}$$

### 6.2 有效粘度计算

一旦求得 $s = u_\tau / u$，则：

$$\tau = \rho u_\tau^2 = \rho (u \cdot s)^2$$

$$\Gamma_w = \frac{\tau \cdot y}{u}$$

## 7. 物理说明

### 7.1 对数层

在 $y^+$ 大于约 30 的对数层内，湍流充分发展，速度分布符合对数律。

### 7.2 粘性底层

当 $y^+ < 10.6$ 时，位于粘性底层或缓冲层，湍流贡献减弱，使用分子粘度。

### 7.3 LES 壁面处理

在 LES 中，无法解析贴近壁面的湍流结构，使用壁面律作为壁面模型。

## 8. 注意事项

1. **迭代容差**: 相对误差 $10^{-5}$ 或 10 次迭代
2. **负值检查**: 如果 $s \leq 0$ 则报错
3. **常数保存**: `CAPPA` 和 `B` 使用 `save` 属性保持

## 9. 相关文件

| 文件 | 关系 |
|------|------|
| `bndry_wall.F90` | 调用 wall 的壁面边界处理 |
| `wall_v.F90` | 速度壁面边界处理 |
| `viscos.F90` | 分子粘度计算 |

