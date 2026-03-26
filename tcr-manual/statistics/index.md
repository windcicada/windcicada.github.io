# statistics

# statistics.F90

## 功能概述
**湍流统计计算子程序**。计算时间平均、Favre 平均、RMS 脉动、协方差等统计量。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `statistics` | 湍流统计计算 |

## 统计类型

### 1. 时间平均
```fortran
! Favre 平均: ρ̃ = ρ̄ξ / ρ̄
! 普通平均: ξ̄ = mean(ξ)
```

### 2. RMS 脉动
```fortran
! 方差: ξ'^2 = ξ̄^2 - ξ̄^2
! RMS: ξ_rms = sqrt(ξ'^2)
```

### 3. 协方差
```fortran
! 雷诺应力: u_i' u_j'
! 标量通量: u' ξ'
```

### 4. TCR 相关统计
- `progress_c_dot_filtered`：进度变量变化率（ESF 滤波）
- `progress_c_dot_psr`：PSR 参考变化率
- `kappa_c`：TCR 体积分数
- `u_prime_over_S_L`：湍流强度比
- `karlovitz`：Karlovitz 数
- `comb_mode_flag`：燃烧模式标志

## 算法描述

### 主循环
```fortran
do k = 2, n
  do j = 2, m
    do i = 2, l
      ijk = i + jo(j) + ko(k)
      ! 统计计算
    enddo
  enddo
enddo
```

### 时间平均更新
```fortran
! 每 time_step 次后累积
fstat(1,ijk) = fstat(1,ijk) + f(nvu,ijk)
! ...
```

## 输出变量
| 统计量 | 含义 |
|--------|------|
| `umean, vmean, wmean` | 平均速度 |
| `uu, vv, ww, uv, uw, vw` | 雷诺应力 |
| `jco2, jh2o, jn2` | 关键物种索引 |
| `fstat` | 统计数组 |

## 依赖模块
- `arrays`：流场数组
- `chemistry`：化学参数
- `exchange`：MPI 通信
- `global`：全局变量
- `sgs_pdf`：PDF 参数

## 重要更新 (2026-03-23)
该文件已修改，包含王煜栋添加的反应进度变量和燃烧模式计算功能。

