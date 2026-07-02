# temperature

# temperature.F90 - 温度与密度计算子程序

## 1. 程序概述

`temperature` 子程序根据给定的**比焓**和**压力**迭代求解温度，然后根据理想气体状态方程计算密度。

## 2. 调用关系

```
boffin.F90 (主循环)
    └── temperature(enth, press, y, temp, rho, ifail)
        ← 在焓方程求解后更新温度和密度
```

## 3. 功能说明

### 3.1 输入输出

| 输入 | 输出 |
|------|------|
| `enth` - 比焓 (J/kg) | `temp` - 温度 (K) |
| `press` - 压力 (Pa) | `rho` - 密度 (kg/m³) |
| `y(nsp)` - 物种质量分数 | `ifail` - 状态标志 |

### 3.2 迭代方法

使用 **Newton-Raphson** 方法求解温度：

$$h(T) - h_{given} = 0$$

## 4. 代码解析

```fortran
subroutine Temperature(enth, press, y, temp, rho, ifail)
  use chemistry, only : cjan, wm, gascon, temp_common, nsp, T_limit
  use global, only : mout

  implicit none
  integer :: i, k, nt, iter, ifail
  double precision :: sumn, summ, fun, funp, c1, dtemp
  double precision, intent(in) :: enth, press, y(nsp)
  double precision, intent(out) :: temp, rho

  ifail = 0

  ! ========== 1. 计算摩尔数 ==========
  sumn = sum(y(:))

  ! ========== 2. Newton 迭代求解温度 ==========
  iter = 0
  dtemp = 1.0d+00
  temp = 300.0d+00  ! 初始猜测 300K

  do while (abs(dtemp) > 1.0d-02 .or. iter == 0)
    iter = iter + 1

    ! 收敛检查
    if (iter > 200 .or. temp < T_limit .or. temp > 6000.0) then
      ifail = 1
      exit
    endif

    ! 计算 h(T) 和 dh/dT
    fun = 0.0d+00
    do i = 1, nsp
      if (temp > temp_common(i)) then
        nt = 1  ! 高温区
      else
        nt = 2  ! 低温区
      endif
      fun = fun + cjan(nt, 5, i) * y(i)
    enddo
    funp = fun
    fun = temp * fun / 5.0d+0

    ! 逐项计算
    do k = 4, 1, -1
      c1 = 0.0d0
      do i = 1, nsp
        if (temp > temp_common(i)) then
          nt = 1
        else
          nt = 2
        endif
        c1 = c1 + cjan(nt, k, i) * y(i)
      enddo
      fun = (c1/real(k) + fun) * temp
      funp = c1 + funp * temp
    enddo

    ! 常数项
    c1 = 0.0d0
    do i = 1, nsp
      if (temp > temp_common(i)) then
        nt = 1
      else
        nt = 2
      endif
      c1 = c1 + cjan(nt, 6, i) * y(i)
    enddo

    fun = fun + c1 - enth / gascon

    ! Newton 迭代
    dtemp = -fun / funp
    temp = temp + dtemp
  enddo

  ! ========== 3. 计算密度 ==========
  rho = press / (gascon * temp * sumn)

end subroutine temperature
```

## 5. 关键变量

### 5.1 化学模块变量

| 变量 | 含义 |
|------|------|
| `cjan(nt, k, i)` | NASA 多项式系数 |
| `wm(i)` | 物种分子量 |
| `gascon` | 通用气体常数 |
| `temp_common(i)` | 物种常用温度阈值 |
| `T_limit` | 温度下限 |
| `nsp` | 物种数 |

### 5.2 迭代参数

| 参数 | 值 | 含义 |
|------|-----|------|
| 最大迭代 | 200 | 防止死循环 |
| 收敛容差 | 1e-2 K | 温度收敛标准 |
| 温度范围 | T_limit ~ 6000 K | 物理范围检查 |

## 6. 算法说明

### 6.1 NASA 多项式

比焓使用 7 系数 NASA 多项式：

$$h(T) = \frac{R}{M} \sum_{n=1}^{5} a_n T^n + a_6$$

其中系数在高温区和低温区不同，通过 `temp_common(i)` 切换。

### 6.2 Newton 迭代

$$T_{new} = T_{old} - \frac{h(T_{old}) - h_{target}}{dh/dT}$$

其中导数通过解析求导获得，保证二阶收敛。

## 7. 物理说明

### 7.1 温度范围

- **低温区** (< temp_common): 使用低温多项式
- **高温区** (> temp_common): 使用高温多项式

### 7.2 密度计算

根据理想气体状态方程：

$$\rho = \frac{p}{R T \sum_i Y_i/M_i}$$

## 8. 错误处理

| 状态码 | 含义 |
|--------|------|
| `ifail = 0` | 正常收敛 |
| `ifail = 1` | 迭代失败（不收敛或超界） |

## 9. 相关文件

| 文件 | 关系 |
|------|------|
| `janaf_input.F90` | 读取 NASA 系数 |
| `CalcTemperature.F90` | 另一个温度计算子程序 |
| `densty.F90` | 密度计算子程序 |
| `enthalpy.F90` | 焓计算 |

