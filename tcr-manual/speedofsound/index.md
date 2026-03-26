# speedofsound

# speedofsound.F90 - 声速计算

> **源文件**: `0.src.TCR.dyn728/speedofsound.F90`
> **功能**: 计算混合物的声速和比热比

---

## 1. 程序概述

计算可压缩流动中混合物的声速和比热比 $\gamma$。

---

## 2. 调用方式

```fortran
call speedofsound(temp, y, cp_mix, c, gamma)
```

### 2.1 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `temp` | `real(kind=8), intent(in)` | 温度 (K) |
| `y(nsp)` | `real(kind=8), intent(in)` | 物种质量分数 |
| `cp_mix` | `real, intent(out)` | 混合气比热容 (J/kg·K) |
| `c` | `real, intent(out)` | 声速 (m/s) |
| `gamma` | `real, intent(out)` | 比热比 |

---

## 3. 算法

### 3.1 比热容计算

```fortran
! 多项式拟合 cp(T)
cp = Σᵢ cjan(nt,k,i) * y(i) * T^(k-1) * gascon
```

### 3.2 比热比

```fortran
gamma = cp / (cp - gascon * sumn)
```

其中 `sumn = Σ y(i)` 为摩尔数。

### 3.3 声速

```fortran
c = sqrt(gamma * gascon * sumn * T)
```

---

## 4. 关键公式

### 4.1 比热容多项式

$$c_p(T) = \sum_{k=1}^{5} c_{1k} T^{k-1}$$

### 4.2 比热比

$$\gamma = \frac{c_p}{c_p - R_u}$$

其中 $R_u$ 为通用气体常数。

### 4.3 声速

$$c = \sqrt{\gamma \cdot R \cdot T}$$

---

## 5. 模块依赖

| 模块 | 变量 |
|------|------|
| `chemistry` | `cjan`, `gascon`, `nsp`, `temp_common` |
| `global` | `mout` |

---

*最后更新: 2026-03-26*


