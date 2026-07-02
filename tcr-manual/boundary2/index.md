# boundary2

# boundary2.F90

## 功能概述
Neumann 边界条件实现。根据边界类型设置系数矩阵，施加第二类边界条件（通量/梯度为零）。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `boundary2` | Neumann 边界系数设置 |

## 边界类型处理

### 1. 入口边界 (-1)
```fortran
coef(bpc) = coef(bpc) + coef(sc) * fsth  ! 固定值
coef(sc) = 0.0  ! 移至右端项
```

### 2. 特征线边界 (-10, -12)
- **-10**：密度特征边界
- **-12**：滞止压力与焓边界
```fortran
coef(bpc) = coef(bpc) + coef(sc) * value
coef(sc) = 0.0
```

### 3. 出口边界 (-2)
零梯度条件：
```fortran
coef(pc) = coef(pc) - coef(sc)  ! 移至对角
coef(sc) = 0.0
```

### 4. 对称/壁面 (-3, -4, -5, -40, -50)
计算壁面距离和法向量，处理：
- **-3**：对称面
- **-4, -40**：壁面（Dirichlet）
- **-5, -50**：壁面（Neumann）

### 5. 常压边界 (-6)
卷吸边界条件处理。

## 关键计算
```fortran
! 壁面距离
dl = nx*(x-x_s) + ny*(y-y_s) + nz*(z-z_s)
! 法向量
call normal(...)
```

## 依赖模块
- `arrays`：系数数组 (coef, sc)、流场 (f, rho, p)
- `chemistry`：物种信息
- `extras`：法向量计算
- `global`：变量索引
- `sgs_pdf`：PDF 开关

