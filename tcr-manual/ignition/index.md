# ignition

# ignition.F90 - Ignition / Equilibrium Initialization

## 概述

`ignition` 子程序使用平衡燃烧模型初始化流场。当混合气的等效比（equivalence ratio）在可燃范围内时，通过平衡计算确定温度和组分。

## 算法原理

### 等效比计算

$$\psi = \nu \cdot \frac{f_f}{f_{air}} \cdot \frac{W_{air}}{W_{fuel}}$$

其中：
- $\nu = n_c + 0.25n_h - 0.5n_o$ (燃料化学计量系数)
- $f_f$ = 燃料质量分数
- $f_{air}$ = 空气分数

### 可燃判据

```fortran
if (psi > 0.5 .and. psi < 1.5) then
  ! 执行平衡计算
end if
```

- $\psi < 0.5$: 过稀，不燃烧
- $\psi > 1.5$: 过浓，不燃烧

### 平衡求解

调用 `equilb` 子程序计算平衡温度和组分：

```fortran
call equilb(enth, press, xa, theta, den, yn)
```

### 随机场平均

对多个随机场样本计算密度和温度均值：

```fortran
! 密度：调和平均
rho(ijk) = nfield / sum(1.0/field_density(1:nfield,ijk))

! 温度：密度加权平均
temp(ijk) = rho(ijk) * sum(field_temperature / field_density) / nfield
```

## 关键变量

| 变量 | 说明 |
|------|------|
| `psi` | 等效比 |
| `theta` | 平衡温度 |
| `den` | 平衡密度 |
| `field_temperature` | 各随机场温度 |
| `field_density` | 各随机场密度 |

## MPI 通信

使用 `pbsrhl` 交换边界上的密度、温度和组分数据。

