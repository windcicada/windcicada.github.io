# boundary wall

# boundary_wall.F90

## 功能概述
壁面边界条件实现。计算壁面热通量、面积累积，处理无滑移或滑移壁面。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `boundary_wall` | 壁面边界处理 |

## 算法描述

### 1. 壁面类型
- **-4**：使用壁面函数（log-law）的无滑移壁面
- **-40**：不使用壁面函数的壁面

### 2. 壁面距离计算
```fortran
dl = nx*(x-x_s) + ny*(y-y_s) + nz*(z-z_s)
```

### 3. 壁面热通量
```fortran
qdot_wall = sum( gamma_t * (h - h_wall) * da ) / nfield
```
其中：
- `-4`：使用 SGS 扩散系数 `gam = visc / (prt * dl)`
- `-40`：使用分子扩散系数 `gam = visc / (pr * dl)`

### 4. 壁面函数调用
```fortran
call wall(vref, dl, visc, rho, gams)
```
计算参考速度，用于对数律壁面模型。

## 输出变量
- `wall_heat_flux`：累积壁面热通量
- `area`：累积壁面面积

## 依赖模块
- `arrays`：粘度 visc、普朗特数 pr, prt
- `chemistry`：物种数 nsp, nsc
- `sgs_pdf`：随机场数 nfield
- `global`：变量索引 (nfo, nvu, nvv, nvw)

