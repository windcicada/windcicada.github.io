# chemsol

# chemsol.F90 - Chemical Kinetic Solver

## 概述

`chemsol` 子程序使用 Newton-Raphson 方法求解刚性化学动力学方程：

$$\frac{dy}{dt} = f(y)$$

其中 y 是物种摩尔数向量。

## 调用关系

- **调用者**: 化学反应计算模块
- **使用模块**: `chemistry`, `global`

## 算法原理

### 隐式时间积分

将 ODE 离散为：

$$\frac{y^{n+1} - y^n}{\Delta t} = f(y^{n+1})$$

重新整理为：

$$f(y^{n+1}) - \frac{y^{n+1} - y^n}{\Delta t} = 0$$

### Newton-Raphson 迭代

```fortran
! 构造 Jacobian
do j = 1, n
  y(j) = y(j) + h(j)
  call ydot(n, y, wdot)
  y(j) = ysave(j)
  dfdy(:,j) = (f(:) - wdot(:)) / h(j)
end do

! 添加时间项
dfdy(k,k) = dfdy(k,k) - 1.0/dt

! 求解线性系统
b = -(wdot - (y - yold)/dt)
call linsol(dfdy, n, d, b)

y = y + b
```

## 收敛判据

```fortran
if (sum(abs(b)) <= tolx .and. abs(1.0 - sum(y*wm)) < tolf) then
  return  ! 收敛
end if
```

- `tolx = 1e-6` - 迭代收敛容差
- `tolf = 1e-4` - 质量守恒容差
- `ntrial = 50` - 最大迭代次数

## 支持的反应机理

| 燃料 | 反应机理 |
|------|----------|
| methane | arm2, red19, 4_step |
| hydrogen | 内置机理 |
| ethylene (C2H4) | 内置机理 |
| n-heptane | 内置机理 |
| methanol | 内置机理 |
| ethanol | 内置机理 |
| ethane, propane, butane | 4_step |

## 错误处理

Intel 编译器下检测 NaN：

```fortran
if (isnan(y(j)) == .true.) then
  y(:) = y_save(:)
  call boffin_stop(__FILE__, __LINE__)
end if
```

## 输出

- `hdot_fg` - 释热率 (kJ/(m³·s))

$$hdot_{fg} = -\rho \sum_i h_{fg,i} \cdot \dot{w}_i$$

