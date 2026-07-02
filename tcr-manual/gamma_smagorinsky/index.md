# gamma smagorinsky

# gamma_smagorinsky.F90 — Smagorinsky 亚格子模型

## 1. 程序概述

**功能**: 计算 Smagorinsky 亚格子涡粘度 (Eddy Viscosity)

**模型公式**:
$$\nu_{t} = (C_s \Delta)^2 |S|$$

其中:
- $C_s$ = 0.1 ~ 0.2 (Smagorinsky 常数)
- $\Delta$ = 滤波尺度 (网格特征长度)
- $|S|$ = 应变率张量 Frobenius 范数

## 2. 算法流程

```
1. 边界处理 → 设置滑移/无滑移壁面速度
2. 循环网格 → 计算速度梯度
3. 计算 Jacobian 逆 → 坐标变换
4. 计算应变率张量 S_ij
5. 计算涡粘度 γ_sgs = ρ * (C_s*Δ)² * |S|
6. 计算 SGS 动能 q
7. 计算总耗散率 ε
8. MPI 通信同步
9. 重置壁面边界条件
```

## 3. 关键计算

### 3.1 速度梯度计算

使用中心差分计算速度梯度:

```fortran
dudi = 0.5*(u(ijkn)-u(ijks))  ! ∂u/∂x (i方向)
dvdi = 0.5*(v(ijkn)-v(ijks))  ! ∂v/∂x
...
```

### 3.2 Jacobian 逆变换

从物理坐标到计算坐标的变换:

```fortran
deta1dx =  (dydj*dzdk-dydk*dzdj)/ajp
deta2dx = -(dydi*dzdk-dydk*dzdi)/ajp
deta3dx =  (dydi*dzdj-dydj*dzdi)/ajp
```

### 3.3 应变率张量

```fortran
e11 = dudx           ! S_11 = ∂u/∂x
e22 = dvdy           ! S_22 = ∂v/∂y
e33 = dwdz           ! S_33 = ∂w/∂z
e12 = 0.5*(dudy+dvdx)! S_12 = 0.5(∂u/∂y + ∂v/∂x)
e13 = 0.5*(dudz+dwdx)! S_13 = 0.5(∂u/∂z + ∂w/∂x)
e23 = 0.5*(dvdz+dwdy)! S_23 = 0.5(∂v/∂z + ∂w/∂y)
```

### 3.4 Frobenius 范数

$$|S| = \sqrt{2(S_{ij}S_{ij})} = \sqrt{2(e_{ij}e_{ij})}$$

```fortran
ee = e11**2 + e22**2 + e33**2 + 2.0*(e12**2+e13**2+e23**2)
e_norm = sqrt(2.0*ee)
```

### 3.5 涡粘度

```fortran
alen = abs(ajc(ijk))**(1.0/3.0)  ! 网格特征长度 Δ
gam_sgs(ijk) = rho(ijk) * (cs0*alen)**2 * e_norm
```

### 3.6 SGS 动能

$$q = \left(\frac{2\nu_t}{\rho}\Delta |S|^2\right)^{2/3}$$

```fortran
q(ijk) = (2.0*gam_sgs(ijk)/rho(ijk)*alen*ee)**(2.0/3.0)
```

### 3.7 总耗散率

$$\varepsilon = 2(\nu_t + \nu)|S|^2$$

```fortran
eps(ijk) = 2.0*(gam_sgs(ijk)+visc(ijk))*ee
```

## 4. 边界条件处理

### 4.1 滑移壁面 (slip_v)

在计算前设置滑移速度:
- 标记: `-4`, `-40`, `-5`, `-50`
- 位置: 紧邻壁面的第一层网格

### 4.2 无滑移壁面 (wall_v)

在计算后重置为无滑移条件:
- 标记: `-4`, `-40`, `-5`, `-50`
- 使用壁面函数 (log-law)

## 5. 输出变量

| 变量名 | 描述 | VTK 名称 |
|--------|------|----------|
| `gam_sgs` | 亚格子涡粘度 | - |
| `q` | SGS 动能 | `sgs_kinetic_energy` |
| `eps` | 总耗散率 | `dissp_rate` |

## 6. 与其他模型的对比

| 模型 | C_s 选项 | 特点 |
|------|----------|------|
| `gamma_smagorinsky` | 常数 (0.1~0.2) | 简单，需手动调参 |
| `gamma_dyn_lilly` | 动态计算 (Lilly 约束) | 自动适应 |
| `gamma_dyn_piomelli` | 动态计算 (Piomelli 约束) | 带回流修正 |
| `gamma_vreman` | Vreman 模型 | 适用于各向异性网格 |

## 7. 调用关系

```
boffin.F90
└── gamma_smagorinsky (when les_model = 'smagorinsky')
    ├── pbsrhl (MPI通信)
    └── mpi_allreduce (全局极值)
```

## 8. 注意事项

1. **cs0 参数**: 在 `module_global` 中定义，默认为 0.1
2. **壁面衰减**: 在壁面附近需使用壁面模型衰减 C_s
3. **MPI 通信**: `pbsrhl` 确保涡粘度在进程间一致


