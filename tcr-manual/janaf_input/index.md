# janaf input

# janaf_input.F90 — JANAF 热力学数据读取

## 功能概述

读取燃料机理目录下的热力学数据文件（therm.d），解析 JANAF 多项式系数，用于计算物种的热力学属性。

## 输入文件

```
path/Fuels/fuel/reaction_mechanism/therm.d
```

文件格式：每个物种一段，包含：
- 物种名称
- 元素原子数
- 温度范围和公共温度
- 7 项多项式系数（2 组：低温/高温）

## 关键变量

```fortran
! 分子量 (g/mol)
double precision,ALLOCATABLE :: wm(:)

! JANAF 系数 [2温度段 × 7系数 × 物种数]
double precision,ALLOCATABLE :: cjan(:,:,:)

! 生成焓 (J/mol)
double precision,ALLOCATABLE :: enth_fg(:)

! 公共温度
double precision,ALLOCATABLE :: temp_common(:)

! 元素原子数 [元素 × 物种]
double precision,ALLOCATABLE :: atom(:,:)
```

## 原子量

| 元素 | 符号 | 原子量 |
|------|------|--------|
| C | 碳 | 12.0112 |
| H | 氢 | 1.00797 |
| N | 氮 | 14.0067 |
| O | 氧 | 15.9994 |
| He | 氦 | 4.002602 |
| Ar | 氩 | 39.948 |

## 计算流程

### 1. 读取分子量

```fortran
wm(jspecies) = Σ atom(i,jspecies) × atomic_weight(i)
```

### 2. 计算生成焓

从 JANAF 多项式积分得到：

$$h_f = \int_{298}^{T} C_p dT + h_{298}$$

其中 $C_p$ 由多项式给出：

$$C_p = a_1 + a_2 T + a_3 T^2 + a_4 T^3 + a_5 T^4$$

积分后：

$$h = a_1 T + \frac{a_2 T^2}{2} + \frac{a_3 T^3}{3} + \frac{a_4 T^4}{4} + \frac{a_5 T^5}{5} + a_6$$

## 输出示例

```
Species JANAF polynomials
Fuel: C3H8  number of species= 12
=========================
C3H8   W=44.096   Enthalpy of Formation= -1.039E+06 kJ/kmol
Common Temperature= 1000.0
```

## 调用关系

```
input → janaf_input → janaf_read
                    ↓
              boffin_stop (错误时)
```

## 错误处理

```fortran
1000 continue
  write(mout,*) 'janaf_input: Unable to find thermo data file:'
  write(mout,*) 'janaf_input:  ', trim(infile)
  call boffin_stop( __FILE__, __LINE__ )
```

---
*Generated from janaf_input.F90*
*Last updated: 2026-03-25*

