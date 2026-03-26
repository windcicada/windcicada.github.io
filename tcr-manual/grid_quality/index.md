# grid quality

# grid_quality.F90 - Grid Quality Assessment

## 概述

`grid_quality` 子程序评估网格质量，确保网格满足数值模拟要求。检查雅可比、行列式、歪斜角等指标。

## 主要检查项目

### 1. 雅可比符号检查

检测网格变换的合法性：

```fortran
if (ajc(ijk)*ajp < 0.0) then
  iflag = 1  ! 错误：雅可比变号
end if
```

### 2. 体积膨胀比

```fortran
ratio = max(ajc(ijk)/ajp, ajp/ajc(ijk))
if (ratio > vratmx) vratmx = ratio
```

### 3. 网格间距检查

计算三个方向的网格间距：

```fortran
ds1 = sqrt((x(i+1)-x(i-1))² + (y(i+1)-y(i-1))² + (z(i+1)-z(i-1))²)
```

### 4. 表面面积检查

检测零面积面：

```fortran
da = sqrt((dxdj*dydk-dxdk*dydj)² + ...)
if (da <= 0.0) iflag = 1
```

### 5. 歪斜角检查

计算网格面法向与单元边向的夹角：

```fortran
angle = acos(sx*nx + sy*ny + sz*nz)
```

## 输出参数

| 参数 | 说明 |
|------|------|
| `iflag` | 错误标志 (0=正常, 1=错误) |
| `ajcmax/ajcmin` | 雅可比最大/最小值 |
| `vratmx` | 最大体积膨胀比 |
| `ds1min/ds1max` | i 方向间距范围 |
| `angle1mx` | 最大歪斜角 |

## MPI 并行

使用 `MPI_MAX`, `MPI_MIN`, `MPI_SUM` 归约获取全局极值。

## 错误处理

发现问题时设置 `iflag = 1` 并输出详细信息，包括问题位置坐标和数值。

