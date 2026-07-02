# output dong

# output_dong.F90

## 功能概述
**自定义后处理输出子程序**。在特定轴向位置（x/d = 1, 2, 3, 7.5, 15, 30, 45, 60, 75）输出场数据，用于与实验测量值对比。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `output_dong` | 自定义场数据输出 |

## 算法描述

### 1. 输出位置定义
```fortran
ra_x = (/1.0, 2.0, 3.0, 7.5, 15.0, 30.0, 45.0, 60.0, 75.0/)
xdname = (/'010', '020', '030', '075', '150', '300', '450', '600', '750'/)
```
定义 9 个轴向位置，用无量纲距离 x/d 表示。

### 2. 喷嘴参数
```fortran
delta_x = 0.00050    ! 网格间距
diam_jet = 0.00720   ! 喷嘴直径 (7.2 mm)
c_curr = 0.9         ! 常数
```

### 3. 物种索引
```fortran
! 提取 O2, H2, H2O, CH4, CO, CO2, OH, N2 等关键物种
do isp = 1, nsp
  if (trim(names(isp)) == 'OH') isp_species(7) = isp
  if (trim(names(isp)) == 'H2') isp_species(2) = isp
  ! ...
enddo
```

### 4. 输出格式
```fortran
4115 FORMAT(F16.9, ',', E16.9)
```
CSV 格式，便于后续数据分析。

## 用途
- 与 Sandia Flame-D 等实验数据对比验证
- 提取特定剖面数据进行后处理分析

## 依赖模块
- `arrays`：数组
- `chemistry`：化学参数
- `global`：全局变量
- `exchange`：MPI 通信

