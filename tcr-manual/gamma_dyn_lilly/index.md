# gamma dyn lilly

# gamma_dyn_lilly.F90

## 功能概述
**动态 Smagorinsky 亚格子模型（Lilly 约束）**。基于 Lilly 约束的动态模型，通过局部风流场信息自适应计算模型系数 C_s。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `gamma_dyn_lilly` | 动态 SGS 粘度计算 |

## 算法描述

### 1. 速度梯度计算
```fortran
! 坐标梯度
dxdi = (x-x_s)*sign(1,iadd)
! 速度梯度
dudx = (u_i+ - u_i-) / dxdi
```

### 2. 应变率张量
$$S_{ij} = \frac{1}{2}\left(\frac{\partial u_i}{\partial x_j} + \frac{\partial u_j}{\partial x_i}\right)$$

### 3. Leonard 项计算
$$L_{ij} = \overline{u_i u_j} - \bar{u}_i \bar{u}_j$$

### 4. 动态系数（Lilly 公式）
$$C_s^* = -0.5 \frac{\langle L_{ij}^a M_{ij} \rangle}{\langle M_{ij}^2 \rangle}$$

其中：
$$M_{ij} = \Delta^2 |\bar{S}| (S_{ij} - \frac{1}{3}\delta_{ij}\bar{S}_{kk})$$

### 5. SGS 粘度
$$\nu_t = (C_s \Delta)^2 |\bar{S}|$$

## 壁面处理
- 调用 `slip_v` 计算滑移速度
- 壁面标记：-4, -40, -5, -50

## 输出变量
- `gam`：SGS 粘度数组
- `work`：存储应变率不变量

## 依赖模块
- `arrays`：流场数组
- `exchange`：MPI 通信
- `extras`：辅助计算
- `global`：网格参数

## 与 gamma_dyn_piomelli 的区别
- **Lilly 约束**：使用 Smagorinsky 类型的尺度相似性
- **Piomelli 约束**：使用涡粘度形式的尺度相似性

