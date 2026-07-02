# boundary2 dp

# boundary2_dp.F90

## 功能概述
压力修正方程 (DP) 的 Neumann 边界条件实现。处理出口边界、对称边界和特征边界的压力修正值。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `boundary2_dp` | 压力修正 Neumann 边界 |

## 边界处理

### 1. 出口边界 (-2)
计算质量流量：
```fortran
flow = flow - (gi + fsmall) * sign(1, iadd)
```
其中 gi 是几何系数。

### 2. 对称边界 (-3)
设置梯度为零：
```fortran
coef(bpc) = coef(bpc) - gi/ajc * sign(1, iadd)
gi = 0.0
```

### 3. 特征线边界 (-6, -60, -62)
保持原有系数（由 NSCBC 处理）。

### 4. 其他边界
默认零梯度处理：
```fortran
coef(pc) = coef(pc) - coef(sc)
coef(sc) = 0.0
```

## 输出变量
- `flow`：出口质量流量（累积）

## 依赖模块
- `extras`：几何量
- `global`：系数索引 (bpc, pc, nvdp)
- `arrays`：系数数组 (coef)、密度 rho

