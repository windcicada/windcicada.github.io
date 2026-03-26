# source pdf

# source_pdf.F90 - PDF 源项计算

> 源文件: `0.src.TCR.dyn728/source_pdf.F90`
> 功能: 计算随机场方程中的源项
> 包含: 随机源项、可压缩项、火花源、热辐射

## 1. 概述

`source_pdf` 子程序计算随机场方程中的各种源项：

1. **随机源项**: Wiener 过程贡献
2. **可压缩源项**: dp/dt + u·∇p
3. **火花源项**: 点火能量输入
4. **热辐射源项**: CO/CO2/H2O/CH4 辐射损失

## 2. 算法流程

```
source_pdf()
│
├─► 随机源项 (ifld > 0 且 nfield > 1)
│   └─► coef(bpc,ijk) += stochastic_source(ijk,nv)
│
├─► 可压缩源项 (compressible 且 isp == nsc)
│   └─► coef(bpc,ijk) += dpdt + u*dpdx + v*dpdy + w*dpdz
│
├─► 火花源项 (spark_ed 且 isp == nsc)
│   └─► coef(bpc,ijk) += spark(qdot, ...)
│
└─► 热辐射源项 (isp == nsc 且 radiate)
    └─► coef(bpc,ijk) -= qdot_rad
        └─► field_qdot_rad(ifld,ijk) = qdot_rad
```

## 3. 源项详解

### 3.1 随机源项

```fortran
if (ifld > 0 .and. nfield > 1) then
  coef(bpc,ijk) = coef(bpc,ijk) + stochastic_source(ijk,nv)
endif
```

来自 `stochastic.F90` 的计算结果。

### 3.2 可压缩源项

```fortran
if (compressible .and. isp == nsc) then
  coef(bpc,ijk) = coef(bpc,ijk) + dpdt + u*dpdx + v*dpdy + w*dpdz
endif
```

焓方程的可压缩修正项。

### 3.3 火花源项

```fortran
if (spark_ed .and. isp == nsc) then
  call spark(qdot, x, y, z, x_spark, y_spark, z_spark, tim, T)
  coef(bpc,ijk) = coef(bpc,ijk) + qdot
endif
```

详见 `module_spark.F90`。

### 3.4 热辐射源项

使用 **WSGGM** (Weighted Sum of Gray Gases Model)：

$$ \dot{Q}_{rad} = \frac{4\sigma p}{\sum Y_i} (T^4 - T_{amb}^4) \sum_i Y_i a_i(T) $$

其中 $a_i(T)$ 为各物种的吸收系数：

| 物种 | 吸收系数公式 |
|------|-------------|
| CO | $c_0 + T(c_1 + T(c_2 + T(c_3 + Tc_4)))$ |
| CO2 | $18.741 - 121.31(1000/T) + ...$ |
| H2O | $-0.231 - 1.124(1000/T) + ...$ |
| CH4 | $6.633 - 0.00357T + ...$ |

温度区间：
- $T \leq 750$ K: 系数 c0-c4
- $T > 750$ K: 不同系数集

## 4. 输出变量

| 变量 | 描述 |
|------|------|
| `coef(bpc,ijk)` | 右端项修正 |
| `field_qdot_rad(ifld,ijk)` | 每场辐射热损失 |

## 5. 调用关系

```
fieldpdf.F90
  └─► source_pdf()
        ├─► stochastic()          ! 随机源项
        ├─► spark()              ! 火花源项
        └─► (无)                  ! 辐射系数为内置公式
```

## 6. 公式索引

| 内容 | 参考 |
|------|------|
| WSGGM | Barlow et al., Comb. Flame 127:2102-2118 (2001) |
| 火花模型 | module_spark.F90 |

