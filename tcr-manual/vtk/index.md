# vtk

# vtk.F90

## 功能概述
**VTK 可视化输出子程序**。将计算结果输出为 VTK Legacy 格式，用于 ParaView/VisIt 可视化。

## 编译选项

### 输出格式
```fortran
#define VTKBINARY    ! 二进制格式（默认）
#undef VTKBINARY     ! ASCII 格式
```

### 节点扩展
```fortran
#define NODE_EXTEND 1  ! 包含边界单元
```

### 调试输出 (MEGAVTK)
```fortran
#define MEGAVTK      ! 输出所有变量（调试用）
#undef MEGAVTK       ! 正常输出（默认）
```

### 特定变量
```fortran
#define sgs_fluxes     ! SGS 标量通量
#undef sgs_fluxes

#define formation_rates  ! 反应率、kappa、坐标（默认开启）
#undef formation_rates
```

## 主要子程序

| 子程序 | 功能 |
|--------|------|
| `vtk_open` | 打开 VTK 文件 |
| `vtk_scalar` | 输出标量 |
| `vtk_vector` | 输出矢量 |
| `vtk_close` | 关闭文件 |

## 输出变量

### 基本流场
- `Velocity`：速度矢量 (U,V,W)
- `Density`：密度 ρ
- `Pressure`：压力 p
- `Temperature`：温度 T

### TCR 相关
- `Damkohler`：Da 数
- `kappa_{species}`：PSR 体积分数
- `RRmix_Oxygen`：积分混合时间尺度
- `RRmix_Radical`：Kolmogorov 混合时间尺度

### 统计量
- `{species}_mean, {species}_rms`
- `Mean_U, Var_U` 等

## 输出文件

### 块数据
```
solution.{istep:08d}.domain.{mydom:03d}.vtk
```

### 平面数据
```
solution.{istep:06d}.plane{LABEL}.{mydom:03d}.vtk
```

### 主文件
```
solution.visit
```

## 依赖模块
- `arrays`：流场数据
- `chemistry`：化学数据
- `global`：全局变量
- `sgs_pdf`：PDF 数据

## 重要更新 (2026-03-23)
VTK 输出已扩展包含王煜栋添加的反应进度变量：
- `Progress_variable_filtered/instantaneous`
- `Progress_variable_c_dot_filtered/PSR`
- `kappa_c`
- `u_prime_over_S_L`, `l_t_over_delta`
- `Karlovitz_number`, `Combustion_mode_flag`
- `{species}_pdf_var`

