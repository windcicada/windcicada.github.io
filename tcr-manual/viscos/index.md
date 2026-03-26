# viscos

# viscos.F90 - 混合物粘度计算

> 源文件: `0.src.TCR.dyn728/viscos.F90`
> 功能: 计算气体混合物的动力粘度
> 方法: Wilke 规则 + Chapman-Enskog 修正

## 1. 概述

`viscos` 子程序计算多组分气体混合物的动力粘度，基于：

1. **纯物质粘度**: Chapman-Enskog 公式 (Perry 方法)
2. **混合物粘度**: Wilke 混合规则

## 2. 算法流程

```
viscos()
│
├─► 初始化临界参数 (Pc, Tc, W)
│   ├─► CO, CO2, H2, N2, O2, H2O, CH4, C3H8, He, AR, C2H4
│   └► 燃料 (jfuel → C3H8 参数)
│
├─► 网格循环 (i=2→lp1-1, j=2→mp1-1, k=2→np1-1)
│   │
│   ├─► 计算摩尔分数 xm(isp)
│   │     xm(isp) = fsc(isp,ijk) / Σfsc
│   │
│   ├─► 计算纯物质粘度 vis(isp)
│   │     vis(T) = 4.610 * T_red^0.618 * exp(...) / c1
│   │     c1 = Tc^1/6 / (sqrt(W) * Pc^2/3)
│   │
│   ├─► Wilke 混合规则
│   │     φ_ij = c2 * (1/sqrt(1+M_i/M_j)) * (1 + sqrt(μ_i/μ_j)*(W_j/W_i)^1/4)^2
│   │     μ_mix = Σ (xm_i * μ_i) / Σ (xm_j * φ_ij)
│   │
│   └─► 存储 visc(ijk)
│
├─► MPI 通信 (pbsrhl) - 边界交换
└─► 全局极值 (vmax, vmin)
```

## 3. 临界参数表

| 物种 | Pc (atm) | Tc (°C) | 主要物种 |
|------|----------|---------|----------|
| CO | 34.5 | 133.0 | ✓ |
| CO2 | 72.9 | 304.2 | ✓ |
| H2 | 12.80 | 33.3 | ✓ |
| N2 | 33.5 | 126.2 | ✓ |
| O2 | 49.7 | 154.4 | ✓ |
| H2O | 218.4 | 647.15 | ✓ |
| CH4 | 45.8 | 190.7 | ✓ |
| C3H8 | 41.92 | 369.85 | ✓ |
| He | 2.27 | 5.19 | ✓ |
| AR | 33.5 | 126.2 | ✓ |
| C2H4 | 50.5 | 9.7 | ✓ |

## 4. 纯物质粘度公式

### 4.1 标准公式 (Perry)
$$ \mu = \frac{4.610 \cdot T_r^{0.618} - 2.04 \exp(-0.449 T_r) + 1.94 \exp(-4.058 T_r) + 0.1}{c_1} $$

其中：
- $T_r = T / T_c$ (对比温度)
- $c_1 = \frac{T_c^{1/6}}{\sqrt{W} \cdot P_c^{2/3}}$
- 结果转换为 kg/(m·s): $\mu = \mu_{microP} \times 10^{-7}$

### 4.2 特殊燃料函数
| 燃料 | 函数 |
|------|------|
| C7H16 (n-heptane) | `visc_nheptane()` |
| CH3OH (methanol) | `visc_methanol()` |
| C2H5OH (ethanol) | `visc_ethanol()` |
| C12H23 (kerosene) | `visc_kerosene()` |

## 5. Wilke 混合规则

$$ \mu_{mix} = \sum_{i=1}^{nsp} \frac{x_i \mu_i}{\sum_{j=1}^{nsp} x_j \Phi_{ij}} $$

其中：
$$ \Phi_{ij} = \frac{1}{\sqrt{8}} \frac{1}{\sqrt{1 + M_i/M_j}} \left[ 1 + \sqrt{\frac{\mu_i}{\mu_j}} \left( \frac{M_j}{M_i} \right)^{1/4} \right]^2 $$

## 6. 输出

| 变量 | 描述 |
|------|------|
| `visc(ijk)` | 混合物动力粘度 (kg/(m·s)) |
| `vmax` | 全局最大粘度 |
| `vmin` | 全局最小粘度 |

## 7. 调用关系

```
boffin.F90
  └─► viscos()
        └─► pbsrhl()        ! MPI 边界交换
```

## 8. 错误处理

```fortran
if (sumn <= 0.0) then
  write(mout,*) 'checkmass: sumn < 0 stop'
  call boffin_stop()
endif
```

## 9. 性能说明

- 仅计算内部网格点 (i=2→lp1-1)
- 边界值通过 MPI 通信获取
- O(nsp²) 复杂度，需优化大物种数情况

## 10. 公式索引

| 内容 | 参考 |
|------|------|
| Chapman-Enskog | Perry's Chem. Eng. Handbook, Sec. 3-279 |
| Wilke 规则 | Wilke, C.R. (1950) |

