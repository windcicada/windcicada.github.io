# module global

# module_global.F90

## 功能概述
**全局参数模块**。定义程序运行所需的全局变量、参数和标志。

## 主要变量

### 字符变量
| 变量 | 说明 |
|------|------|
| `statfile, resfile, geofile` | 输出文件路径 |
| `statdir, resdir, geodir` | 目录路径 |
| `sgs_viscosity` | SGS 模型类型 |
| `species_output` | 物种输出格式 |

### 整数参数
| 参数 | 值 | 说明 |
|------|------|------|
| `nvu, nvv, nvw` | 1,2,3 | 速度分量索引 |
| `nvdp` | 4 | 压力修正索引 |
| `nvf` | 5 | 混合分数索引 |
| `nvh` | 6 | 焓索引 |
| `nc, sc, ec, wc, rc, lc, pc, bpc` | 1-8 | 系数数组索引 |

### 逻辑变量
| 变量 | 说明 |
|------|------|
| `burn` | 燃烧开关 |
| `read_restart, write_restart` | 重启读写 |
| `turbstat` | 湍流统计开关 |
| `radiate` | 辐射开关 |

### 实数变量
| 变量 | 说明 |
|------|------|
| `dtim` | 时间步长 |
| `cflmax, cflmin` | CFL 数的最大/最小值 |
| `atime` | 平均时间 |
| `tim` | 当前物理时间 |

## Fortran 参数
```fortran
real,parameter :: pi = 3.141592653589793
integer,parameter :: lin=10, nin=11, mout=12, nout=13, statout=14, scrn=15
```

## 网格尺寸变量
- `imax, jmax, kmax`：网格单元数
- `l, m, n`：X/Y/Z 方向内点数
- `lp1 = l+1, mp1 = m+1, np1 = n+1`

