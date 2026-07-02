# module arrays

# module_arrays.F90

## 功能概述
**主数组模块**。定义程序中使用的所有大型数组，包括流场变量、网格数据、系数矩阵等。

## 主要数组分类

### 1. 边界标记数组
| 数组 | 说明 |
|------|------|
| `ibn, ibs, ibe, ibw, ibr, ibl` | 六个面的边界标记 |
| `inflowps, inflowpn, ...` | 入口面编号映射 |
| `outflowps, outflowpn, ...` | 出口面编号映射 |

### 2. 索引数组
| 数组 | 说明 |
|------|------|
| `io, jo, ko` | 网格偏移索引 |
| `nfo` | 变量偏移索引 |
| `icycl, ncycl` | 循环索引 |

### 3. 网格坐标
| 数组 | 说明 |
|------|------|
| `x, y, z` | 网格点坐标 |
| `xv, yv, zv` | 顶点坐标 |
| `ajc` | 网格单元体积 |

### 4. 流场变量
| 数组 | 说明 |
|------|------|
| `rho, rhold, rhobar` | 密度相关 |
| `p, p_mean` | 压力 |
| `gam` | SGS 粘度 |
| `u, v, w` | 速度分量（在 f 数组中）|

### 5. 系数矩阵
| 数组 | 说明 |
|------|------|
| `coef` | 系数矩阵 (ncoef × nijk) |
| `work` | 工作数组 |
| `gi, gj, gk` | 对流项系数 |

### 6. 辅助数组
| 数组 | 说明 |
|------|------|
| `w1, w2, w3` | 临时工作数组 |
| `cs, csxi` | Smagorinsky 系数 |
| `fnth, fsth, ...` | 边界值数组 |

### 7. 梯度数组
| 数组 | 说明 |
|------|------|
| `dpdx, dpdy, dpdz` | 压力梯度 |
| `dfdx, dfdy, dfdz` | 标量梯度 |

### 8. 度规数组
| 数组 | 说明 |
|------|------|
| `b11, b12, b13` | 度规系数 |

## 逻辑数组
```fortran
logical, allocatable :: print(:), tvd(:), plot_vtk(:)
```
- `print`：打印开关
- `tvd`：TVD 格式开关
- `plot_vtk`：VTK 输出开关

## 字符数组
```fortran
character(len=25), allocatable :: title(:)
```
- 用于变量标题

## 分配时机
这些数组在 `config_boffin.F90` 或 `boffin.F90` 中根据网格尺寸动态分配。

