# gvctr3

# gvctr3.F90 - Compressible Mass Flux Calculation

## 概述

`gvctr3` 子程序计算可压缩流动的质量通量。与 `gvctr` 不同，它考虑 `drhodp` 项（密度对压力的导数），用于可压缩流模拟。

## 与 gvctr 对比

| 特征 | gvctr | gvctr3 |
|------|-------|--------|
| 适用 | 不可压缩 | 可压缩 |
| 密度处理 | ρ | drhodp (∂ρ/∂p) |
| 通量计算 | ρu | (∂ρ/∂p)u |

## 算法原理

### i 方向通量

```fortran
drhodpn = w1(ijk)*drhodp(ijk) + (1.0-w1(ijk))*drhodp(ijkn)
drhodpu = drhodpn * (w1(ijk)*u(ijk) + (1.0-w1(ijk))*u(ijkn))
fi(ijkn) = drhodpu*(dydj*dzdk-dydk*dzdj) - drhodpv*(dxdj*dzdk-dxdk*dzdj) + drhodpw*(dxdj*dydk-dxdk*dydj)
```

### j 方向通量

```fortran
drhodpe = w2(ijk)*drhodp(ijk) + (1.0-w2(ijk))*drhodp(ijke)
fj(ijke) = -drhodpu*(dydi*dzdk-dydk*dzdi) + drhodpv*(dxdi*dzdk-dxdk*dzdi) - drhodpw*(dxdi*dydk-dxdk*dydi)
```

### k 方向通量

```fortran
drhodpr = w3(ijk)*drhodp(ijk) + (1.0-w3(ijk))*drhodp(ijkr)
fk(ijkr) = drhodpu*(dydi*dzdj-dydj*dzdi) - drhodpv*(dxdi*dzdj-dxdj*dzdi) + drhodpw*(dxdi*dydj-dxdj*dydi)
```

## 输入变量

| 变量 | 说明 |
|------|------|
| `drhodp` | ∂ρ/∂p (密度对压力导数) |
| `u,v,w` | 速度分量 |
| `w1,w2,w3` | 迎风权重 |

## 输出

- `fi` - i 方向质量通量
- `fj` - j 方向质量通量
- `fk` - k 方向质量通量

