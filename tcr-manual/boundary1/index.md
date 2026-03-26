# boundary1

# boundary1.F90

## 功能概述
Dirichlet 边界条件实现。根据变量类型（压力、速度、标量）设置边界系数矩阵，使内点值等于边界值。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `boundary1` | Dirichlet 边界系数设置 |

## 算法描述

### 1. 压力修正 (nv == nvdp)
```fortran
if (ibs NOT IN {-6, -60, -62, -100}) gam = 0.0
```
排除常压入口和特征边界。

### 2. 速度分量 (nv == nvu/nvv/nvw)
```fortran
if (ibs != -100) gam = 0.0
```

### 3. 标量 (混合分数、焓、物种)
```fortran
if (ibs != -100) gam = 0.0
```

### 原理
将系数矩阵中对角系数 gam 置零，使得：
$$a_P \phi_P = \sum a_n \phi_n + b \Rightarrow \phi_P = \phi_{boundary}$$

## 边界排除类型
- **-100**：内部点（跳过）
- **-6**：常压入口（使用特殊处理）
- **-60, -62**：特征线边界（由 NSCBC 处理）

## 依赖模块
- `arrays`：系数数组 gam
- `chemistry`：标量数 nsc
- `global`：变量索引 (nvu, nvv, nvw, nvdp, nvh)
- `sgs_pdf`：随机场数 ifld

