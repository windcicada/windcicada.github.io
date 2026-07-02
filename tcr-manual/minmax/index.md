# minmax

# minmax.F90

## 功能概述
**极值搜索子程序**。遍历全场找出指定变量的最大值和最小值及其位置坐标。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `minmax` | 极值搜索 |

## 算法描述

### 1. 初始化
```fortran
fmax(nv) = f(ijk)  ! 初始值
fmin(nv) = f(ijk)  ! 初始值
```

### 2. 全场遍历
```fortran
do i = 2,l
  do j = 2,m
    do k = 2,n
      if (f(ijk) > fmax(nv)) fmax(nv) = f(ijk), x_max, y_max, z_max
      if (f(ijk) < fmin(nv)) fmin(nv) = f(ijk), x_min, y_min, z_min
    enddo
  enddo
enddo
```

### 3. MPI 归约
```fortran
call pbmaxl(fmax, x_max, y_max, z_max, l_dom1)  ! 全局最大值
call pbminl(fmin, x_min, y_min, z_min, l_dom2)  ! 全局最小值
```

## 输出变量
| 变量 | 说明 |
|------|------|
| `fmax(nv)` | 全局最大值 |
| `fmin(nv)` | 全局最小值 |
| `x_max, y_max, z_max` | 最大值坐标 |
| `x_min, y_min, z_min` | 最小值坐标 |

## 依赖模块
- `arrays`：jo, ko, fmax, fmin, x, y, z
- `exchange`：MPI 归约
- `global`：lower, upper, l, m, n, nv

