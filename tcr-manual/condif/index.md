# condif

# CONDIF.F90 - 对流扩散项离散

## 功能概述

`CONDIF` 是 TCR 求解器中构建 **对流-扩散方程系数矩阵** 的核心子程序。它负责计算三个方向（i, j, k）的对流和扩散项系数，构建用于动量方程和标量方程求解的离散矩阵。

## 算法特点

| 特性 | 说明 |
|------|------|
| 离散格式 | 混合迎风/TVD格式 |
| 适用范围 | 动量方程 + 标量方程 |
| 向量化 | 优化循环顺序 |

## 系数计算

### i 方向系数

```fortran
! 西南系数 (sc)
coef(sc,ijk) = (tip + w1(ijks)*gi(ijk)) / ajc(ijk)

! 东北系数 (nc)  
coef(nc,ijk) = (tip - (1.0-w1(ijk))*gi(ijkn)) / ajc(ijk)
```

其中:
- `tip = b11(ijk) * gam_n(i)` - 界面扩散系数
- `w1` - 权重函数 (介于 0~1 之间)
- `gi` - i 方向几何因子

### j 方向系数

```fortran
coef(wc,ijk) = (tjp + w2(ijkw)*gj(ijk)) / ajc(ijk)
coef(ec,ijk) = (tjp - (1.0-w2(ijk))*gj(ijke)) / ajc(ijk)
```

### k 方向系数

```fortran
coef(lc,ijk) = (tkp + w3(ijkl)*gk(ijk)) / ajc(ijk)
coef(rc,ijk) = (tkp - (1.0-w3(ijk))*gk(ijkr)) / ajc(ijk)
```

## TVD 格式处理

当启用 TVD 格式时：

```fortran
if (tvd(nv) .and. nv < nf+1) then
    call vls(f(lower+nfo(nv)), b11, j, k, gi, ibs, ibn, l, w1, &
              imax, io, jmax, jo, kmax, ko, gam_n)
endif
```

### 扩散系数计算

```fortran
if (tvd(nv) .and. nv >= nf+1) then
    gam_n(i) = gam_i(ijk)
else
    gam_n(i) = w1(ijk)*gam(ijk) + (1.0-w1(ijk))*gam(ijkn)
endif
```

- **nf+1 以后变量**: 使用网格单元中心扩散系数
- **nf+1 以前变量**: 使用界面插值扩散系数

## 关键变量

| 变量 | 用途 |
|------|------|
| `gam_n(i)` | i 方向界面扩散系数 |
| `gam_e(j)` | j 方向界面扩散系数 |
| `gam_r(k)` | k 方向界面扩散系数 |
| `w1/w2/w3` | 权重函数 |
| `b11/b22/b33` | 几何系数矩阵 |
| `gi/gj/gk` | 方向几何因子 |

## 矩阵系数索引

| 索引 | 方向 | 说明 |
|------|------|------|
| `sc` | i-1 | 南/左系数 (South) |
| `nc` | i+1 | 北/右系数 (North) |
| `wc` | j-1 | 西/下系数 (West) |
| `ec` | j+1 | 东/上系数 (East) |
| `lc` | k-1 | 下系数 (Low) |
| `rc` | k+1 | 上系数 (High) |
| `pc` | 对角 | 主对角系数 |

## 调用链

```
boffin.F90
  └→ 动量/标量求解循环
       └→ condif (构建对流-扩散系数)
            └→ vls (TVD 限制器计算)
            └→ cgstab (求解动量方程)
```

## 与求解器的关系

- `condif` 构建系数矩阵
- `cgstab` 使用这些系数求解动量方程
- `cgsol` 使用类似系数求解压力方程

## 数值格式说明

### 迎风格式 (Upwind)
当 `w1 = 0` 时，使用完全迎风格式：
- 对流项：上游值
- 数值稳定但有较大数值扩散

### 中心格式 (Central)
当 `w1 = 0.5` 时，使用中心格式：
- 对流项：上下游平均值
- 需要人工黏性保持稳定

### TVD 格式
使用 van Leer 限制器保证 TVD 性质：
- 在激波附近自动切换到迎风
- 在平滑区域使用高阶格式

