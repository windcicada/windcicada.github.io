# gamma k

# gamma_k.F90 — k-方程亚格子模型

## 1. 程序概述

**功能**: 基于 SGS 动能 $k$ 的亚格子涡粘度模型

**模型公式**:
$$\nu_t = C_k \sqrt{k} \Delta$$

其中 $k$ 是亚格子动能，$\Delta$ 是滤波尺度。

## 2. 算法流程

```
1. 设置滑移壁面速度
2. 计算瞬时速度梯度 S_ij
3. 边界扩展 S_ij
4. 网格过滤计算局部平均速度/应变率
5. 计算局部 Smagorinsky 常数 C_s
6. 计算涡粘度 γ_sgs
7. 计算 SGS 动能 q 和耗散率 ε
8. MPI 通信同步
9. 重置无滑移壁面条件
```

## 3. 关键计算

### 3.1 速度梯度 (瞬时)

存储 6 个独立分量:
```fortran
sij(ijk+nfo(1)) = dudx          ! S_11
sij(ijk+nfo(2)) = 0.5*(dudy+dvdx)! S_12
sij(ijk+nfo(3)) = 0.5*(dudz+dwdx)! S_13
sij(ijk+nfo(4)) = dvdy          ! S_22
sij(ijk+nfo(5)) = 0.5*(dvdz+dwdy)! S_23
sij(ijk+nfo(6)) = dwdz          ! S_33
```

### 3.2 网格过滤 (Volume Filtering)

使用加权体积平均计算局部平均量:

```fortran
weight(-1,-1,-1) = 1.0     ! 中心
weight(±1,0,0)   = 0.5    ! 面中心
weight(±1,±1,0) = 0.25    ! 边中心
weight(±1,±1,±1)= 0.125   ! 角
```

**体积平均速度**:
$$ \bar{u} = \frac{\sum u \cdot V_c}{\sum V_c} $$

**SGS 动能**:
$$ q = 0.5(\overline{u_i^2} - \bar{u_i}\bar{u_i}) $$

### 3.3 Smagorinsky 常数计算

$$C_s = \frac{q}{(\Delta \cdot |S|)^2}$$

```fortran
if (ss > sqrt(q_test)/length) then
  cs(ijk) = q_test/(length*ss)**2
else
  cs(ijk) = 0.0
endif
```

### 3.4 涡粘度

$$\nu_t = \rho C_s \Delta \sqrt{k}$$

```fortran
gam_sgs(ijk) = rho(ijk) * cs(ijk) * length * sqrt(q(ijk))
```

### 3.5 SGS 动能和耗散率

$$q = \left(\frac{2\nu_t}{\rho}\Delta |S|^2\right)^{2/3}$$

$$\varepsilon = 2(\nu_t + \nu)|S|^2$$

## 4. 与 Smagorinsky 模型对比

| 特性 | Smagorinsky | k-方程模型 |
|------|-------------|-----------|
| C_s | 全局常数 | 局部计算 |
| 计算量 | 较小 | 较大 |
| 适应性 | 差 | 好 (自动衰减) |
| 边界层 | 需额外处理 | 自动衰减到 0 |

## 5. 输出变量

| 变量名 | 描述 |
|--------|------|
| `gam_sgs` | 亚格子涡粘度 |
| `cs(ijk)` | 局部 Smagorinsky 常数 |
| `q` | SGS 动能 |
| `eps` | 总耗散率 |

## 6. 边界处理

- **滑移壁面**: 计算前设置 (slip_v)
- **无滑移壁面**: 计算后重置 (wall_v)
- **S_ij 扩展**: 边界内部点复制到 ghost 单元

## 7. 调用关系

```
boffin.F90
└── gamma_k (when les_model = 'k')
    ├── bndry3crn (边界扩展)
    ├── pbsrhl (MPI通信)
    └── mpi_allreduce (全局极值)
```


