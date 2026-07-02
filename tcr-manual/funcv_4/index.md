# funcv 4

# funcv_4.F90 — Jones-Lindstedt 化学反应机理

## 1. 程序概述

`funcv_4` 子程序实现 **Jones-Lindstedt 简化化学反应机理**，用于甲烷及其他碳氢燃料的燃烧模拟。该机理仅包含 4 个总包反应，平衡计算与详细机理之间的折中。

## 2. 化学反应机理

### 2.1 总包反应（R1-R4）

| 编号 | 反应 | 类型 |
|------|------|------|
| **R1** | H₂ + 0.5 O₂ ⇌ H₂O | 水生成反应 |
| **R2** | CO + H₂O ⇌ CO₂ + H₂ | CO 平衡反应 |
| **R3** | CₙHₘ + n H₂O → n CO + (n+m/2) H₂ | 蒸汽重整 |
| **R4** | CₙHₘ + n/2 O₂ → n CO + m/2 H₂ | 氧化反应 |

### 2.2 产物生成规则

```fortran
wdot(jfuel)  = -(r3+r4)
wdot(jco)    = n_c*(r3+r4) + rb2 - r2
wdot(jh2)    = rb1 - r1 + r2 - rb2 + (n_c + 0.5*n_h)*r3 + 0.5*n_h*r4
wdot(jco2)   = r2 - rb2
wdot(jh2o)   = r1 - rb1 + rb2 - r2 - n_c*r3
wdot(jo2)    = 0.5*(rb1 - r1) - 0.5*n_c*r4
```

## 3. 反应速率计算

### 3.1 预指数因子修正

根据燃料类型调整反应速率：

```fortran
if (trim(fuel) == 'methane') then
    kf1 = 2.50d16 * exp(-40000/(rgas*temp)) / temp
elseif (trim(fuel) == 'propane') then
    kf1 = 3.00d16 * exp(-40000/(rgas*temp)) / temp
elseif (trim(fuel) == 'kerosene') then
    ! 煤油需要碳原子数修正
    corr = max(min(1.0 - 20.0*(ff - 0.07), 1.0), 0.0)
    kf1 = 1.00d15 * exp(-40000/(rgas*temp)) / temp
    kf1 = corr * kf1
endif
```

### 3.2 动力学参数

| 反应 | 预指数因子 A | 活化温度 Tₐ (K) |
|------|--------------|-----------------|
| R1 (H₂ oxidation) | 2.5×10¹⁶ | 40000/R |
| R2 (CO + H₂O) | 2.75×10⁹ | 20000/R |
| R3 (steam reforming) | 3.0×10⁸ | 30000/R |
| R4 (fuel oxidation) | 4.4×10¹¹ | 30000/R |

## 4. 平衡常数计算

### 4.1 熵与焓

```fortran
h(nv) = cjan(nt,1,nv) + 0.5*cjan(nt,2,nv)*temp + cjan(nt,3,nv)*te2/3.0 &
       + 0.25*cjan(nt,4,nv)*te3 + 0.2*cjan(nt,5,nv)*te4 + cjan(nt,6,nv)/temp

g(nv) = h(nv) - cjan(nt,1,nv)*alnt - cjan(nt,2,nv)*temp &
       - 0.5*cjan(nt,3,nv)*te2 - cjan(nt,4,nv)*te3/3.0 &
       - 0.25*cjan(nt,5,nv)*te4 - cjan(nt,7,nv)
```

### 4.2 平衡常数表达式

```fortran
ek1 = exp(g(H2) + 0.5*g(O2) - g(H2O) + 0.5*alngt)
ek2 = exp(g(CO) + g(H2O) - g(CO2) - g(H2))
```

## 5. 数值稳定性措施

### 5.1 裁剪策略 (Clipping)

当某些物种质量分数极小时，避免数值奇点：

```fortran
clim = 1.0e-5 * sumn  ! 最小浓度阈值

if (f(jh2o) < clim .and. f(jh2) < clim) then
    r1 = kf1 * rho**(pwr-0.5) * f(jh2) * f(jo2)**(pwr+1.0) / clim**1.5
endif
```

### 5.2 密度指数修正

```fortran
pwr = 1.25  ! 甲烷
if (trim(fuel) == 'kerosene') pwr = 0.90
```

## 6. 变量说明

### 6.1 输入参数

| 参数 | 说明 |
|------|------|
| `nsp` | 物种数 |
| `f(nsp)` | 物种质量分数数组 |
| `temp` | 温度 (K) |
| `rho` | 密度 (kg/m³) |
| `press` | 压力 (Pa) |
| `iopt` | 选项标志 (1=初始化, 0=计算反应率) |

### 6.2 输出参数

| 参数 | 说明 |
|------|------|
| `wdot(nsp)` | 各物种的质量生成率 (kg/m³/s) |

### 6.3 内部变量

| 参数 | 说明 |
|------|------|
| `kf1-kf4` | 正向反应速率常数 |
| `kb2` | R2 逆向反应速率常数 |
| `ek1, ek2` | 平衡常数 |
| `r1-r4` | 各反应的正向反应速率 |
| `rb1, rb2` | 逆向反应速率 |

## 7. 与其他模块的关系

- **调用者**: `react_hc.F90`, `chemsol.F90`
- **输入**: 温度、密度、混合分数
- **输出**: 物种反应率 `wdot`
- **依赖**: `chemistry` 模块（燃料参数、原子计量数）

## 8. 适用场景

- **优势**: 计算效率高，适合 LES/RANS 大涡模拟
- **局限**: 无法捕捉详细化学动力学特征（如 NOₓ 生成）
- **推荐**: 快速燃烧预测、参数化研究


