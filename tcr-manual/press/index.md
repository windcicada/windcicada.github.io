# press

# PRESS.F90 - 压力方程构建

## 功能概述

`PRESS` 是 TCR 求解器中构建 **压力泊松方程** 系数矩阵的子程序。它基于质量守恒方程（连续性方程）推导出压力修正方程的离散形式，用于 SIMPLE 算法中的压力求解。

## 算法位置

`PRESS` 在主时间步循环中的位置：

```
1. 动量预测 (cgstab)
2. 压力方程构建 (press)
3. 压力求解 (cgsol)
4. 速度修正 (update)
```

## 方程推导

压力方程来自离散化的质量守恒方程：

```
∂ρ/∂t + ∇·(ρu) = 0
```

在不可压缩/可压缩 SIMPLE 算法中，转化为压力泊松方程：

```
∇²(p*) = ∇·(ρu*) / Δt
```

## 系数计算

### i 方向系数

```fortran
! 界面扩散系数
tau = w1(ijk)*gam(ijk) + (1.0-w1(ijk))*gam(ijkn)
tip = b11(ijk) * tau

! 西南系数
coef(sc,ijk) = tip / ajc(ijk)

! 东北系数  
coef(nc,ijk) = tip / ajc(ijk)

! 右端项修正
coef(bpc,ijk) = coef(bpc,ijk) - (gi(ijkn) - gi(ijk)) / ajc(ijk)
```

### j 方向系数

```fortran
tau = w2(ijk)*gam(ijk) + (1.0-w2(ijk))*gam(ijke)
tjp = b22(ijk) * tau

coef(wc,ijk) = tjp / ajc(ijk)
coef(ec,ijk) = tjp / ajc(ijk)
coef(bpc,ijk) = coef(bpc,ijk) - (gj(ijke) - gj(ijk)) / ajc(ijk)
```

### k 方向系数

```fortran
tau = w3(ijk)*gam(ijk) + (1.0-w3(ijk))*gam(ijkr)
tkp = b33(ijk) * tau

coef(lc,ijk) = tkp / ajc(ijk)
coef(rc,ijk) = tkp / ajc(ijk)
coef(bpc,ijk) = coef(bpc,ijk) - (gk(ijkr) - gk(ijk)) / ajc(ijk)
```

## 与 CONDIF 的对比

| 特性 | PRESS | CONDIF |
|------|-------|--------|
| 方程 | 压力泊松方程 | 对流-扩散方程 |
| 右端项 | 质量源项修正 | 源项 |
| 求解器 | CGSOL (PCG) | CGSTAB (Bi-CGSTAB) |
| 矩阵性质 | 对称正定 | 非对称 |

## 关键变量

| 变量 | 含义 |
|------|------|
| `gam` | 有效扩散系数 (分子 + SGS) |
| `w1/w2/w3` | 权重函数 |
| `b11/b22/b33` | 几何系数 |
| `gi/gj/gk` | 几何因子 (通量相关) |
| `ajc` | 单元体积 |

## 右端项构成

压力方程的右端项 `coef(bpc,ijk)` 包含：
1. **速度散度项** - 来自质量守恒
2. **通量修正项** - 来自界面通量差

```fortran
coef(bpc,ijk) = -∇·(ρu*) / Δt
```

## 调用链

```
boffin.F90
  └→ 时间步循环
       ├→ 动量求解 (cgstab)
       ├→ press (构建压力方程)
       ├→ cgsol (求解压力)
       └→ update (修正速度场)
```

## 数值特性

- **离散格式**: 二阶中心格式
- **系数矩阵**: 对称正定
- **收敛特性**: 通常 10-50 次迭代收敛
- **预处理**: ICCG(1,1,1) 不完全乔莱斯基分解

