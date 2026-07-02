# Calcmassflowrate

# Calcmassflowrate.F90

## 功能概述
计算入口和出口质量流量，并对出口流量进行修正以满足全局质量守恒。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `Calcmassflowrate` | 质量流率计算与修正 |

## 算法描述

### 1. 入口流量累加
```fortran
if (ibs == -1 .or. -10 .or. -12) then
    floin = floin + gi * sign(1, iadd)
```

### 2. 出口流量累加
```fortran
if (ibs == -2 .or. -6 .or. -60 .or. -62) then
    flout = flout - gi * sign(1, iadd)
```

### 3. 质量守恒修正
对于零梯度出口边界 (-2)：
```fortran
gi_new = ((flow + summ) / flow) * (gi + sign(fsmall, gi))
coef(bpc) = coef(bpc) + (gi_new - gi_old) / ajc * sign(1, iadd)
```
确保入口质量流量等于出口质量流量。

## 参数
| 参数 | 说明 |
|------|------|
| `flow` | 当前净流量 |
| `summ` | 待添加的流量修正 |
| `floin` | 总入口流量 |
| `flout` | 总出口流量 |

## 依赖模块
- `global`：系数索引 (bpc, nvdp)
- `arrays`：系数数组 (coef)、几何量 (ajc)

