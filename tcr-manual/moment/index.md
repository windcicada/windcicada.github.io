# moment

# moment.F90

## 功能概述
**PDF 矩计算子程序**。对每个随机场样本进行统计，计算标量的均值（第一矩）和方差（第二矩）。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `moment` | PDF 均值与方差计算 |

## 算法描述

### 1. 遍历所有网格
```fortran
do k = 1, np1
  do j = 1, mp1
    do i = 1, lp1
      ijk = i + jk
```

### 2. 随机场平均
```fortran
fsc(isp, ijk) = 0.0
fsc2(isp, ijk) = 0.0
do ifld = 1, nfield
  ijkp = nfo(nf + ifld*nsc + isp) + ijk
  fsc(isp,ijk)  = fsc(isp,ijk)  + f(ijkp)      ! 累加
  fsc2(isp,ijk) = fsc2(isp,ijk) + f(ijkp)**2  ! 累加平方
end do
```

### 3. 均值计算
```fortran
if (isp <= nsp) then
  fsc(isp,ijk) = max(fsc(isp,ijk)/real(nfield), 0.0)  ! 物种非负
else
  fsc(isp,ijk) = fsc(isp,ijk)/real(nfield)  ! 标量可为负
```

### 4. 方差计算（基于二阶矩减一阶矩平方）
```fortran
fsc2(isp,ijk) = fsc2(isp,ijk)/real(nfield)
fsc2(isp,ijk) = fsc2(isp,ijk) - fsc(isp,ijk)**2
fsc2(isp,ijk) = max(fsc2(isp,ijk), 0.0)  ! 防止数值误差
```

### 5. MPI 通信
```fortran
call pbsrhl(fsc(isp,:), 2)   ! 均值归约
call pbsrhl(fsc2(isp,:), 2)  ! 方差归约
```

## 输出变量
| 变量 | 说明 |
|------|------|
| `fsc(isp,ijk)` | 标量 isp 的滤波均值 |
| `fsc2(isp,ijk)` | 标量 isp 的滤波方差 |

## 公式
$$\tilde{\phi} = \frac{1}{N_f} \sum_{n=1}^{N_f} \xi^n$$

$$\widetilde{\phi'^2} = \frac{1}{N_f} \sum_{n=1}^{N_f} (\xi^n)^2 - \tilde{\phi}^2$$

## 依赖模块
- `arrays`：jo, ko, nfo, f
- `chemistry`：isp, nsc, nsp, fsc, fsc2
- `global`：lower, upper, lp1, mp1, np1, nf
- `sgs_pdf`：nfield

