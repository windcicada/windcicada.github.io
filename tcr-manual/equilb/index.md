# equilb

# equilb.F90 - Equilibrium Composition Solver

## 概述

`equilb` 子程序使用 Gordon-McBride 方法（NASA SP-273）求解给定 enthalpy、pressure 和元素浓度的平衡组分。

## 调用关系

- **调用者**: 化学反应求解器
- **使用模块**: `chemistry`, `global`

## 算法原理

### 输入

- `enth` - 比焓 (J/kg)
- `press` - 压力 (Pa)
- `xa(nel)` - 元素浓度 (kmol/kg)
- `f(nsp)` - 初始guess (kmol/kg)
- `rho` - 初始密度 guess

### 输出

- `temp` - 平衡温度 (K)
- `f` - 平衡摩尔数 (kmol/kg)
- `rho` - 平衡密度 (kg/m³)

### Newton-Raphson 迭代

平衡求解通过求解非线性方程组：

1. **元素守恒方程** (nel 个):
$$\sum_j n_j a_{ij} = x_a(i)$$

2. **摩尔数守恒** (1 个):
$$\sum_j n_j = n_{total}$$

3. **能量守恒** (1 个):
$$\sum_j n_j h_j = \frac{h}{R} n_{total} T$$

### 迭代过程

```fortran
do while(iter < niter .and. error > emax)
  ! 计算热力学属性 (cp, h, μ)
  ! 构建 Jacobian 矩阵
  ! 求解线性系统
  ! 更新 T, n, sumn
end do
```

## 关键变量

| 变量 | 说明 |
|------|------|
| `nel` | 元素数量 |
| `nsp` | 物种数量 |
| `atom(i,j)` | 物种 j 中元素 i 的原子数 |
| `cjan` | NASA 多项式系数 |

## 热力学属性

### 比热容
```fortran
cp(j) = cjan(1,j) + cjan(2,j)*T + cjan(3,j)*T² + cjan(4,j)*T³ + cjan(5,j)*T⁴
```

### 焓
```fortran
h(j) = cjan(1,j) + cjan(2,j)*T/2 + cjan(3,j)*T²/3 + cjan(4,j)*T³/4 + cjan(5,j)*T⁴/5 + cjan(6,j)/T
```

### 化学势
```fortran
g(j) = h(j) - R*T*(ln(f(j)/n_total) + ln(p/p_ref)) + cjan(7,j)*R*T
```

## 收敛参数

- `niter = 100` - 最大迭代次数
- `emax = 1e-8` - 收敛误差阈值

## 注意事项

1. 使用双精度计算以保证精度
2. 包含松弛因子防止数值不稳定
3. 负摩尔数处理 (置零)

