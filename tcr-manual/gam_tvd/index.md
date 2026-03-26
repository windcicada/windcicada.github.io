# gam tvd

# gam_tvd.F90

## 功能概述
**TVD（Total Variation Diminishing）格式的 SGS 扩散系数计算**。对标量使用 TVD 格式计算扩散系数，确保数值格式的 TVD 性质。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `gam_tvd` | TVD 格式 SGS 扩散系数 |

## 算法描述

### 1. 插值计算
```fortran
gam_n(i) = w1(ijk)*gam(ijk) + (1-w1(ijk))*gam(ijkn)
```
使用权重 w1 在相邻网格点间插值。

### 2. TVD 限制器
```fortran
call vls(f, b11, j, k, gi, ibs, ibn, l, w1, ...)
```
调用 vls 子程序应用 TVD 限制器，确保标量分布的单调性。

### 3. 最大值选取
```fortran
gam_i(ijk) = max(gam_i(ijk), gam_n(i))
```
对所有物种取最大扩散系数。

### 4. MPI 通信
```fortran
call pbsrhl(gam_i, 1)
```
同步各进程的扩散系数。

## 参数
| 参数 | 说明 |
|------|------|
| `w1` | 插值权重 |
| `gi` | 逆网格度规 |
| `b11` | 度规系数 |
| `ibs, ibn` | 边界标记 |

## 输出
- `gam_i`：TVD 格式扩散系数数组

## 依赖模块
- `arrays`：gam, f, nfo
- `chemistry`：nsp, nsc
- `global`：nf, lower, upper
- `sgs_pdf`：ifld

