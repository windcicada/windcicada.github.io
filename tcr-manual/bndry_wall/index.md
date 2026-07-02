# bndry wall

# bndry_wall.F90

## 功能概述
壁面边界条件 wrapper，计算壁面热损失和壁面面积。对六个计算域边界调用 `boundary_wall`，累积壁面热通量。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `bndry_wall` | 主子程序，遍历所有壁面边界 |

## 算法描述

### 1. 壁面遍历
对六个边界（X±, Y±, Z±）调用 `boundary_wall`：

### 2. MPI 归约
```fortran
call mpi_allreduce(mpi_in_place, wall_heat_loss, ...)
call mpi_allreduce(mpi_in_place, area_wall, ...)
```

### 3. 输出变量
- `wall_heat_loss`：总壁面热损失（W）
- `area_wall`：总壁面面积（m²）

## 依赖模块
- `arrays`：边界标记 (ibs, ibw, ibl, ibn, ibe, ibr)
- `global`：网格信息
- `exchange`：MPI 通信

