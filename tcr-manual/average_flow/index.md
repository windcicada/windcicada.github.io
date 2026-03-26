# average flow

# average_flow.F90

## 功能概述
计算入口和出口边界的流量平均值，用于稳态/瞬态流场统计。通过对六个入口/出口面（X/Y/Z正负方向）的速度分量进行面积加权平均，获取平均流量信息。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `average_flow` | 主子程序，计算六个边界的流量平均 |

## 算法描述

### 1. 边界遍历
对六个边界分别调用 `averaged` 子程序：
- **入口边界**：i=2（负X向）、j=2（负Y向）、k=2（负Z向）
- **出口边界**：i=l（正X向）、j=m（正Y向）、k=n（正Z向）

### 2. 面积加权平均
```fortran
averaged_inflow(i,:) = array(:) / area_in(i)  ! 入口
averaged_outflow(i,:) = array(:) / area_out(i) ! 出口
```

### 3. MPI 归约
使用 `mpi_allreduce` 将各进程的局部面积和流量汇总到全局。

## 关键变量

### 输入
| 变量 | 类型 | 说明 |
|------|------|------|
| `u, v, w` | real, dimension(lower:upper) | 速度分量 |

### 输出（模块变量）
| 变量 | 类型 | 说明 |
|------|------|------|
| `averaged_inflow` | real, dimension(nip,5) | 入口边界平均速度 (u,v,w,密度,质量流率) |
| `averaged_outflow` | real, dimension(nop,5) | 出口边界平均速度 |
| `area_in, area_out` | real, dimension(*) | 入口/出口面积 |

## 调用关系
- **被调用**：通常在 `statistics.F90` 或后处理阶段调用
- **调用**：`averaged` 子程序（计算单个面的流量统计）

## 依赖模块
- `global`：网格尺寸 (l,m,n,imax,jmax,kmax)
- `arrays`：边界标记 (ibs,ibn,ibw,ibe,ibl,ibr)、面积数组
- `exchange`：MPI 通信相关

