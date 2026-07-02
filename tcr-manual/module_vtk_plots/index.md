# module vtk plots

# module_vtk_plots.F90 - VTK 绘图模块

> **源文件**: `0.src.TCR.dyn728/module_vtk_plots.F90`
> **功能**: VTK 可视化输出的配置和管理

---

## 1. 模块概述

定义 VTK 可视化输出的配置参数和平面定义数据。

---

## 2. 变量声明

### 2.1 输出控制

| 变量 | 类型 | 说明 |
|------|------|------|
| `vtkplots` | `integer` | 当前绘图数量 |
| `vtkmaxplots` | `integer` | 最大绘图数量 |

### 2.2 平面定义

| 变量 | 维度 | 说明 |
|------|------|------|
| `vtk_id(:)` | `(100)` | 平面标签 (4字符) |
| `vtk_ijkp(:,:)` | `(100, 2)` | 平面 IJK 位置 |
| `vtk_xyzp(:,:)` | `(100, 4)` | 平面坐标参数 (A,B,C,D) |

### 2.3 变量范围

| 变量 | 类型 | 说明 |
|------|------|------|
| `vtk_nvs` | `integer` | 起始变量索引 |
| `vtk_nve` | `integer` | 结束变量索引 |

---

## 3. 平面定义格式

### 3.1 vtk.d 文件格式

```
LABEL A B C D
```

例如:
```
Y050     0.0  1.0  0.0  0.50   ! y = 0.5 平面
Z050     0.0  0.0  1.0  0.50   ! z = 0.5 平面
X100     1.0  0.0  0.0  1.00   ! x = 1.0 平面
```

### 3.2 坐标方程

```
Ax + By + Cz = D
```

---

## 4. 使用说明

### 4.1 调用方式

```fortran
! 块数据和平面数据同时输出
if (mod(istep, stepplot) .eq. 0) then
    call vtk(u, v, w, initial_step, 0)
endif

! 仅输出平面数据（更频繁）
if (mod(istep, stepplot/10) .eq. 0) then
    call vtk(u, v, w, initial_step, 1)
endif
```

### 4.2 输出模式

| opt | 输出内容 |
|-----|----------|
| 0 | 块数据 + 平面数据 |
| 1 | 仅平面数据 |

### 4.3 Ghost 区域

`NODE_EXTEND=1` 时包含边界单元，便于流线追踪。

---

## 5. 输出文件命名

### 5.1 块数据
```
solution.{istep:08d}.domain.{mydom:03d}.vtk
```

### 5.2 平面数据
```
solution.{istep:06d}.plane{LABEL}.{mydom:03d}.vtk
```

### 5.3 Visit 主文件
```
solution.visit
```

---

*最后更新: 2026-03-26*


