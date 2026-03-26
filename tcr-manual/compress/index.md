# compress

# compress.F90 — 可压缩性修正

## 1. 程序概述

`compress` 子程序向动量方程添加**可压缩性贡献**（compressibility contributions），用于考虑密度变化对流场的影响。这是压力基求解器中处理可压缩流动的关键模块。

## 2. 物理背景

在压力基求解器中，通过假设密度仅与压力变化相关（Boussinesq 近似或状态方程的线性化），可压缩性效应被建模为源项：

$$\frac{\partial \rho}{\partial p} \cdot \frac{\partial p}{\partial t}$$

该修正项被添加到动量方程的对角系数中，确保数值稳定性。

## 3. 算法流程

### 3.1 核心思想

对每个方向（i, j, k），程序：
1. 计算当地声速系数 `gam_n`, `gam_e`, `gam_r`
2. 使用 TVD（Total Variation Diminishing）格式计算界面通量
3. 将可压缩性贡献添加到系数矩阵的三对角分量

### 3.2 TVD 格式条件

```fortran
if (tvd(nvdp)) then
    call vls(p, b11, j, k, fi, ibs, ibn, l, w1, ...)
endif
```

当启用压力修正 `dp` 的 TVD 格式时，计算界面系数 `gam_*`；否则设为零。

## 4. 系数更新公式

### 4.1 i 方向

```fortran
coef(sc,ijk) = coef(sc,ijk) + 0.5*(tip + w1(ijks)*fi(ijk)/ajc(ijk))
coef(pc,ijk) = coef(pc,ijk) + 0.5*(tip - (1.0-w1(ijks))*fi(ijk))/ajc(ijk)
coef(nc,ijk) = coef(nc,ijk) + 0.5*(tip - (1.0-w1(ijk))*fi(ijkn))/ajc(ijk)
```

其中：
- `tip = b11(ijk) * gam_n(i)` — 界面压力梯度系数
- `fi` — i 方向的质量通量
- `w1` — TVD 权重因子
- `ajc` — 单元体积

### 4.2 j 方向

```fortran
coef(wc,ijk) = coef(wc,ijk) + 0.5*(tjp + w2(ijkw)*fj(ijk))/ajc(ijk)
coef(pc,ijk) = coef(pc,ijk) + 0.5*(tjp - (1.0-w2(ijkw))*fj(ijk))/ajc(ijk)
```

### 4.3 k 方向

```fortran
coef(lc,ijk) = coef(lc,ijk) + 0.5*(tkp + w3(ijkl)*fk(ijk))/ajc(ijk)
coef(rc,ijk) = coef(rc,ijk) + 0.5*(tkp - (1.0-w3(ijk))*fk(ijkr))/ajc(ijk)
```

## 5. 密度导数项

### 5.1 对角系数修正

```fortran
coef(pc,ijk) = coef(pc,ijk) + drhodp(ijk)/dtim
```

其中 `drhodp` 是密度对压力的导数：
- **可压缩流动**：`drhodp = 1 / c²`（c 为当地声速）
- **不可压缩流动**：`drhodp = 0`

### 5.2 时间步长影响

该修正项与时间步长 `dtim` 成反比，隐式处理密度脉动的时间演变。

## 6. 关键变量

| 变量 | 含义 |
|------|------|
| `b11`, `b22`, `b33` | 各方向的网格度量系数 |
| `fi`, `fj`, `fk` | 各方向的质量通量 |
| `w1`, `w2`, `w3` | TVD 权重因子 |
| `gam_n`, `gam_e`, `gam_r` | TVD 界面系数 |
| `drhodp` | 密度对压力的导数 |
| `ajc` | 单元体积 |

## 7. 网格索引

```
i ∈ [1, l]    — x 方向
j ∈ [1, m]    — y 方向
k ∈ [1, n]    — z 方向
```

内点循环从 i=2, j=2, k=2 开始，避开边界单元。

## 8. 与其他模块的关系

- **输入**: `p` (压力), `fi/fj/fk` (质量通量), `drhodp` (状态方程)
- **输出**: 更新 `coef` 数组的三对角系数
- **调用**: 由主程序 `boffin.F90` 在动量方程求解前调用

## 9. 注意事项

1. 该子程序仅在可压缩流动时产生非零贡献
2. TVD 格式需要配合 `vls` 子程序计算界面值
3. 系数更新采用半隐式格式，确保数值稳定性


