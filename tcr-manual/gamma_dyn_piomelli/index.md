# gamma dyn piomelli

# gamma_dyn_piomelli.F90

## 功能概述
**动态 Smagorinsky 亚格子模型（Piomelli 约束）**。使用 Piomelli 约束的动态模型，限制系数 C_s 以避免在壁面附近过度耗散。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `gamma_dyn_piomelli` | 动态 SGS 粘度计算（Piomelli 约束） |

## 与 gamma_dyn_lilly 的区别

| 特征 | Lilly | Piomelli |
|------|-------|----------|
| 约束方式 | Smagorinsky 类型 | 涡粘度类型 |
| 壁面处理 | 标准动态模型 | 限制 C_s 上限 |
| 计算量 | 相似 | 相似 |

## 算法描述

### 1. 动态系数计算
```fortran
csdyn => work(nfo(1))  ! 动态 C_s 存储
sij   => work(nfo(2))  ! 应变率不变量
```

### 2. 测试过滤
使用两层过滤（网格尺度 + 测试尺度）计算 Leonard 项：
- 网格尺度：Δ
- 测试尺度：αΔ (α > 1)

### 3. 模型系数
$$C_s = \frac{\langle L_{ij} M_{ij} \rangle}{\langle M_{ij} M_{ij} \rangle}$$

### 4. Piomelli 约束
在壁面附近限制 C_s：
```fortran
csdyn = min(csdyn, cs_max)
```

## 输出变量
- `gam`：SGS 粘度
- `work(1)`：动态 C_s 系数
- `work(2)`：应变率不变量

## 依赖模块
- `arrays`：流场数组
- `exchange`：MPI 通信
- `extras`：辅助计算
- `global`：网格参数

