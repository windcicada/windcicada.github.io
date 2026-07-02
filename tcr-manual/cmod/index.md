# cmod

# cmod.F90 — 时间中心格式 (Time-Centred Scheme)

## 1. 程序概述

`cmod` 子程序实现**时间中心格式**（Time-Centred Scheme），即 **Crank-Nicolson 格式**的有限体积实现。该格式在时间方向上具有二阶精度，通过对当前时间步和上一时间步的系数进行加权平均来实现。

## 2. 物理背景

### 2.1 时间离散格式

对于瞬态问题，有三种基本格式：

| 格式 | 精度 | 稳定性 | 代码实现 |
|------|------|--------|----------|
| 显式前向 Euler | 一阶 | 条件稳定 | 较少用 |
| 隐式后向 Euler | 一阶 | 无条件稳定 | `step.F90` |
| **Crank-Nicolson** | **二阶** | **无条件稳定** | **`cmod.F90`** |

### 2.2 Crank-Nicolson 格式

$$\frac{\phi^{n+1} - \phi^n}{\Delta t} = \frac{1}{2} \left( L(\phi^{n+1}) + L(\phi^n) \right)$$

其中 $L$ 是空间算子（对流+扩散+源项）。该格式将隐式和显式部分各取 50%，获得二阶时间精度。

## 3. 算法实现

### 3.1 系数衰减

```fortran
coef(pc,ijk) = 0.5 * coef(pc,ijk)
coef(sc,ijk) = 0.5 * coef(sc,ijk)
coef(nc,ijk) = 0.5 * coef(nc,ijk)
coef(wc,ijk) = 0.5 * coef(wc,ijk)
coef(ec,ijk) = 0.5 * coef(ec,ijk)
coef(lc,ijk) = 0.5 * coef(lc,ijk)
coef(rc,ijk) = 0.5 * coef(rc,ijk)
```

将三对角矩阵的所有系数乘以 0.5，意味着新旧时间步各占 50%。

### 3.2 右端项更新

```fortran
coef(bpc,ijk) = coef(bpc,ijk) &
              + coef(sc,ijk) * fold(ijks) &
              + coef(nc,ijk) * fold(ijkn) &
              + coef(wc,ijk) * fold(ijkw) &
              + coef(ec,ijke) * fold(ijke) &
              + coef(lc,ijk) * fold(ijkl) &
              + coef(rc,ijk) * fold(ijkr) &
              - coef(pc,ijk) * fold(ijkp)
```

其中：
- `fold` — 上一时间步的变量值
- `ijkp` — 当前单元索引
- `ijks/n/w/e/l/r` — 相邻单元索引

### 3.3 物理意义

右端项的新增部分表示：
$$\text{RHS}_{\text{new}} = \text{RHS}_{\text{old}} + 0.5 \cdot A_{\text{old}} \cdot \phi^n$$

其中 $A_{\text{old}}$ 是上一时间步的系数矩阵。

## 4. 网格索引系统

```
ijkp  — 当前单元 (i,j,k)
ijks  — i-1 方向邻居 (西/左)
ijkn  — i+1 方向邻居 (东/右)
ijkw  — j-1 方向邻居 (南/下)
ijke  — j+1 方向邻居 (北/上)
ijkl  — k-1 方向邻居 (下)
ijkr  — k+1 方向邻居 (上)
```

## 5. 系数矩阵结构

```
| pc  nc   0   0   0   0   0  |   | φ_{i+1} |
| sc  pc  nc   0   0   0   0  |   | φ_i    |
|  0  sc  pc  nc   0   0   0  | × | φ_{i-1} |
|  0   0  sc  pc  nc   0   0  |   | ...    |
| ...                        |   |        |
```

每条系数更新为原值的 50%，保持矩阵的三对角结构。

## 6. 与其他模块的关系

- **调用者**: `boffin.F90` 主程序
- **输入**: 
  - `coef(*,ijk)` — 当前系数矩阵
  - `fold(ijk)` — 上一时间步的变量值
- **输出**: 更新后的 `coef` 数组
- **前置**: 通常在 `condif.F90` 构建系数后调用

## 7. 稳定性分析

### 7.1 稳定性

Crank-Nicolson 格式**无条件稳定**，对任意时间步长都保持数值稳定。

### 7.2 精度

- **时间精度**: 二阶精度 $O(\Delta t^2)$
- **空间精度**: 取决于 `condif.F90` 的空间离散格式

### 7.3 振荡问题

当解变化剧烈时，Crank-Nicolson 可能产生数值振荡。可采用：
- 延迟时间格式（under-relaxation）
- 限流器（flux limiter）

## 8. 使用场景

- 需要二阶时间精度的高精度模拟
- 燃烧室入口流场计算
- 大涡模拟（LES）的时间推进
- 声学问题（需要时间精度）

## 9. 对比：Euler vs Crank-Nicolson

| 特性 | 后向 Euler | Crank-Nicolson |
|------|------------|----------------|
| 精度 | 一阶 | 二阶 |
| 稳定性 | 无条件稳定 | 无条件稳定 |
| 计算量 | 相同 | 相同 |
| 振荡性 | 无 | 可能 |

## 10. 注意事项

1. 需要保存上一时间步的解 `fold`
2. 右端项计算包含 6 个邻居 + 自身，共 7 项
3. 仅处理内点（i=2:l, j=2:m, k=2:n），边界由边界条件处理


