# gamma vreman

# gamma_vreman.F90

## 功能概述
**Vreman 亚格子模型**。基于 Vreman (2004) 的涡粘模型，使用速度梯度张量的不变量计算 SGS 粘度。

## 参考文献
A. W. Vreman, "An eddy-viscosity subgrid-scale model for turbulent shear flow: Algebraic theory and applications", Physics of Fluids, 16, 3679, 2004.

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `gamma_vreman` | Vreman SGS 粘度计算 |

## 算法描述

### 1. 速度梯度张量分解
```fortran
dudx, dudy, dudz  ! du/dx, du/dy, du/dz
dvdx, dvdy, dvdz  ! dv/dx, dv/dy, dv/dz
dwdx, dwdy, dwdz  ! dw/dx, dw/dy, dw/dz
```

### 2. Beta 张量
$$\beta_{ij} = \frac{\partial u_j}{\partial x_i}$$

### 3. 判别式 B
$$B = \beta_{11}\beta_{22} + \beta_{11}\beta_{33} + \beta_{22}\beta_{33} - (\beta_{12}^2 + \beta_{13}^2 + \beta_{23}^2)$$

### 4. Vreman 公式
$$\nu_t = C_v \sqrt{\frac{|B|}{\alpha_{ij}\alpha_{ij}}}$$

其中：
- $\alpha_{ij}$：过滤后的速度梯度
- $C_v$：模型常数 (0.07)

## 特点
- **优点**：在壁面附近自动衰减，无需壁面衰减函数
- **计算量**：比动态模型小
- **稳定性**：数值稳定性好

## 与其他模型对比
| 模型 | 壁面处理 | 计算复杂度 |
|------|----------|------------|
| Smagorinsky | 需要衰减函数 | 低 |
| 动态模型 | 需要动态计算 | 高 |
| Vreman | 自动衰减 | 中 |

## 依赖模块
- `arrays`：流场数组
- `exchange`：MPI 通信
- `extras`：辅助计算
- `global`：网格参数

