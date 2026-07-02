# CalcTemperature

# CalcTemperature.F90 - 温度与密度计算

> 源文件: `0.src.TCR.dyn728/CalcTemperature.F90`
> 功能: 根据焓和组分计算温度、密度
> 方法: 迭代求解 (Newton-Raphson 或二分法)

## 1. 概述

`CalcTemperature` 子程序根据标量场 (焓+组分) 计算温度和密度：

- **输入**: 焓 H, 压力 p, 物种 Y_i
- **输出**: 温度 T, 密度 ρ, 热释放率 HRR

这是 PDF 方法中连接标量与热力学状态的关键步骤。

## 2. 算法流程

```
CalcTemperature(ifld_start)
│
├─► 随机场循环 (ifld = ifld_start → nfield)
│   │
│   └─► 网格循环 (全部网格点)
│       │
│       ├─► 读取组分 yn(isp) 和焓 enth
│       │
│       ├─► 调用 temperature() 求解 T
│       │   └─► enthalpy() 反算 / Newton-Raphson
│       │
│       ├─► 密度计算 (状态方程)
│       │   ρ = p / (R * T * Σ(Y_i/W_i))
│       │
│       ├─► 错误处理
│       │   └─► if ifail → 使用 T_limit
│       │
│       └─► 存储 field_temperature, field_density
│
├─► 过滤值计算
│   │
│   ├─► 密度 (调和平均)
│   │   ρ = nfield / Σ(1/ρ_ifld)
│   │
│   ├─► 温度 (密度加权平均)
│   │   T = ρ * Σ(T_ifld/ρ_ifld) / nfield
│   │
│   ├─► 热释放率 (算术平均)
│   │   HRR = Σ(hdot_ifld) / nfield
│   │
│   └► 辐射损失 (算术平均)
│       q_rad = Σ(qdot_rad_ifld) / nfield
│
└─► MPI 通信 (pbsrhl)
```

## 3. 关键公式

### 3.1 温度求解

调用 `temperature()` 子程序：

```fortran
call temperature(enth, press, yn, theta, den, ifail)
```

内部使用：
- **Newton-Raphson 迭代**: $H(T) - H_{target} = 0$
- **查找表**: JANAF 热力学数据
- **参考状态**: $H = \sum Y_i (H_i^0 + \int_{T_ref}^T C_p dT)$

### 3.2 密度计算

$$ \rho = \frac{p}{R T \sum_i \frac{Y_i}{W_i}} = \frac{p M}{R T} $$

其中：
- $R$: 通用气体常数
- $M$: 摩尔质量
- $W_i$: 物种 i 的分子量

### 3.3 过滤密度 (调和平均)

$$ \bar{\rho} = \frac{N_f}{\sum_{k=1}^{N_f} \frac{1}{\rho^{(k)}}} $$

这是从 N 个随机场样本计算过滤密度的正确方式 (保证质量守恒)。

### 3.4 过滤温度 (密度加权)

$$ \tilde{T} = \bar{\rho} \cdot \sum_{k=1}^{N_f} \frac{T^{(k)}}{\rho^{(k)} \cdot N_f} $$

同样保证能量守恒。

## 4. 输出变量

| 变量 | 计算方式 | 描述 |
|------|----------|------|
| `field_temperature(ifld,ijk)` | 直接存储 | 每场温度 |
| `field_density(ifld,ijk)` | 直接存储 | 每场密度 |
| `rho(ijk)` | 调和平均 | 过滤密度 |
| `temp(ijk)` | 密度加权 | 过滤温度 |
| `heat_fg(ijk)` | 算术平均 | 热释放率 |
| `qdot_rad(ijk)` | 算术平均 | 辐射损失 |

## 5. 错误处理

### 5.1 求解失败 (ifail = 1)

```fortran
if (ifail == 1) then
  ! 使用极限温度 T_limit
  call enthalpy(T_limit, yn, enth)
  theta = T_limit
  den = press / (gascon * theta * sum(yn(:)))
endif
```

### 5.2 负密度

```fortran
if (den < 0.0) then
  write(mout, *) 'i=...', 'den=<0 stop'
  call boffin_stop()
endif
```

## 6. 调用关系

```
fieldpdf.F90
  └─► CalcTemperature()
        ├─► temperature()     ! 温度求解
        │     └─► enthalpy()  ! JANAF 数据
        ├► pbsrhl()          ! MPI 通信
        └► (输出到) → boffin.F90 全局变量
```

## 7. 密度加权平均的物理解释

使用调和平均计算过滤密度的原因：

1. **质量守恒**: $\bar{\rho} = \overline{\rho^{-1}}^{-1}$ 是正确的体积平均
2. **通量守恒**: 过滤密度用于对流项，保证正确通量

使用密度加权平均计算过滤温度的原因：

1. **能量守恒**: $H = \sum Y_i H_i$，温度通过焓反算
2. **PDF 形式**: $E[T] = \int T(Y) p(Y) dY$，需要权重

## 8. 性能说明

- 计算所有网格点 (lp1*mp1*np1)
- 每随机场都调用 `temperature()` (耗性能)
- 后续需要优化可考虑缓存/查找表

## 9. 公式索引

| 内容 | 参考 |
|------|------|
| JANAF 表 | NIST Chemistry WebBook |
| 状态方程 | $p = \rho R T / M$ |
| 调和平均 | Pope, "Turbulent Flows" |

