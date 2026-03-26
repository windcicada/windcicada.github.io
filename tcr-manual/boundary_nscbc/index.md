# boundary NSCBC

# boundary_NSCBC.F90

## 功能概述
**NSCBC 特征线边界条件**的核心实现。基于特征线理论，为可压缩反应流提供物理一致的入口/出口边界处理。

## 参考文献
- Yoo et al. (2005) - Combustion Theory and Modelling, 9, 617-646
- Yoo & Im (2007) - Combustion Theory and Modelling, 11, 259-286
- Lodato et al. (2008) - JCP 227, 5105-5143

## 主要算法

### 1. 特征线分解
将边界法向速度分解为 6 个特征变量（L1-L6），分别对应：
- L1, L2, L3：熵、涡、声波
- L4, L5, L6：反应物/产物相关

### 2. 入口边界（-10）
基于目标值和外推值的加权混合：
```fortran
L1 = alpha * L1_target + (1-alpha) * L1_extrap
```

### 3. 出口边界（-60, -62）
采用无反射条件，抑制伪反射波：
```fortran
dp/dt = -c * (p - p_ambient)  ! 压力松弛
```

### 4. 坐标变换 Jacobian
计算度规系数：
```fortran
ajp = deta1/dxi + deta2/deta + deta3/dzeta
```

## 关键变量

### 局部变量
| 变量 | 说明 |
|------|------|
| `dxdi, dydi, dzdi` | 坐标梯度 |
| `v1, v2, v3` | 速度分量 |
| `dpdi, dpdj, dpdk` | 压力梯度 |
| `c, Mach` | 音速、马赫数 |

### 控制参数
| 参数 | 默认值 | 说明 |
|------|--------|------|
| `eta` | 4.0 | 阻尼系数 |

## 边界类型
- **-10**：密度特征边界
- **-60**：压力特征边界
- **-62**：压力特征边界（出口）

## 依赖模块
- `arrays`：流场变量 (f, rho, p)
- `chemistry`：化学量 (fsc, yn, temp)
- `global`：求解器参数
- `sgs_pdf`：PDF 场

