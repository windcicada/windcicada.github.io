# 湍流燃烧大涡模拟：代码实现


> 详细介绍亚音速可压缩燃烧模拟软件 CSTCSP/AECSC/BOFFIN 的架构和全部函数，由该软件的 123 个代码文档整理得到。

## 1. 程序概述

**TCR (Turbulent Combustion Research)** 是基于 LES 的湍流燃烧求解器，采用随机场 (Stochastic Field) PDF 方法模拟湍流燃烧过程。

### 主要特性

| 特性 | 说明 |
|------|------|
| 数值方法 | 单元中心有限体积法 |
| 湍流模型 | LES + 多种亚格子模型 (Smagorinsky, 动态模型, Vreman) |
| 燃烧模型 | 随机场 PDF 方法 + TCR 微混合模型 |
| 求解器 | 压力基 SIMPLE-like 算法 |
| 并行 | MPI 分布式内存并行 |

### 支持的燃料

- 甲烷 (`funcv_ch4_red19`, `funcv_ch4_arm2`)
- 氢气 (`funcv_h2`)
- 乙醇 (`funcv_c2h5oh`)
- 甲醇 (`funcv_ch3oh`)
- 庚烷 (`funcv_c7h16`)
- 乙烯 (`funcv_c2h4`)

---

## 2. 程序架构

### 2.1 主程序流程

```
boffin (主程序)
│
├─ 初始化阶段
│   ├─ input         (读取输入参数)
│   ├─ janaf_input   (读取热力学数据)
│   ├─ geom          (计算网格几何)
│   ├─ inprofile     (用户自定义初始/入口条件)
│   ├─ start_init    (初始化流场)
│   ├─ start_probe   (初始化探针)
│   ├─ start_pdf    (初始化 PDF 方法)
│   └─ start_phase_averaging (相平均初始化)
│
└─ 时间步循环
    │
    ├─ 1. 保存旧时刻数据
    ├─ 2. 入口边界条件 (openinflow, inprofile)
    ├─ 3. 亚格子模型 (gamma_*)
    ├─ 4. CFL 计算和时间步调整 (courant)
    ├─ 5. PDF/燃烧计算 (fieldpdf → mixer + reactor)
    ├─ 6. 动量方程求解 (condif → cgstab)
    ├─ 7. 压力修正 (press → cgsol → update)
    ├─ 8. 后处理 (statistics, probe, minmax)
    ├─ 9. VTK/输出 (vtk, output)
    └─ 10. 终止条件检查 (boffin_stop)
```

详细见 [boffin.md](/tcr-manual/boffin/)

### 2.2 核心模块关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                        boffin.F90                               │
│                         (主程序)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   初始化模块    │    │   求解器模块   │    │   后处理模块    │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ input         │    │ condif        │    │ statistics    │
│ janaf_input   │    │ cgstab        │    │ probe         │
│ geom          │    │ cgsol         │    │ minmax        │
│ start_init    │    │ press         │    │ vtk           │
│ start_read    │    │ update        │    │ output        │
│ start_pdf     │    │ step          │    └───────────────┘
└───────────────┘    └───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  燃烧模型模块   │    │  SGS 模型模块  │    │  边界模块    │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ fieldpdf      │    │ gamma_smag    │    │ bndry1        │
│ stochastic    │    │ gamma_dyn_*   │    │ bndry2        │
│ mixer         │    │ gamma_vreman  │    │ bndry3        │
│ reactor       │    │ gamma_k       │    │ boundary_*   │
│ react_hc      │    └───────────────┘    └───────────────┘
│ react_psr     │
└───────────────┘
```

---

## 3. 核心算法

### 3.1 求解器算法

#### 3.1.1 动量方程求解器: Bi-CGSTAB

详细见 [cgstab.md](/tcr-manual/cgstab/)

| 参数 | 说明 |
|------|------|
| 算法 | 双共轭梯度稳定化 (Bi-CGSTAB) |
| 预处理器 | ILU (不完全 LU 分解) |
| 适用方程 | 动量方程 (非对称矩阵) |
| 收敛条件 | `error > tol(nv)` |
| 最大迭代 | `icycl(nv)` |

#### 3.1.2 压力方程求解器: PCG + ICCG

详细见 [cgsol.md](/tcr-manual/cgsol/)

| 参数 | 说明 |
|------|------|
| 算法 | 预条件共轭梯度 (PCG) |
| 预处理器 | ICCG (不完全乔莱斯基分解) |
| 适用方程 | 压力泊松方程 (对称正定矩阵) |
| 特点 | 相比 CGSTAB 更适合对称矩阵 |

#### 3.1.3 对流-扩散项离散: CONDIF

详细见 [condif.md](/tcr-manual/condif/)

- **离散格式**: 混合迎风/TVD 格式
- **适用范围**: 动量方程 + 标量方程
- **TVD 限制器**: van Leer 格式 (见 [vls.md](/tcr-manual/vls/))

#### 3.1.4 压力修正方程: PRESS

详细见 [press.md](/tcr-manual/press/)

- **方程来源**: 质量守恒方程推导
- **系数矩阵**: 对称正定
- **右端项**: 速度散度修正

#### 3.1.5 时间步进: STEP

详细见 [step.md](/tcr-manual/step/)

- **时间格式**: 一阶隐式 Euler
- **处理方式**:
  - 压力修正模式 (`nv == nvdp`): 只更新右端项
  - 变量求解模式: 更新系数矩阵和对角项

#### 3.1.6 速度压力更新: UPDATE

详细见 [update.md](/tcr-manual/update/)

- **速度修正公式**: $u^* = u^n - \frac{\Gamma}{\rho} \frac{\partial dp}{\partial x}$
- **压力更新**: $p^{n+1} = p^n + dp$
- **可压缩模式**: 密度更新 `rho += 0.5 * drhodp * dp`

### 3.2 燃烧模型

#### 3.2.1 随机场 PDF 方法: FIELDPDF

详细见 [fieldpdf.md](/tcr-manual/fieldpdf/)

**核心原理**: 基于 N. S. B. Ito 型随机微分方程求解标量场方程

$$\phi(\mathbf{x}, t) = \phi_0(\mathbf{x}) + \int_0^t \left[ S + \nabla \cdot (\Gamma \nabla \phi) \right] dt + \text{Wiener process}$$

**关键参数**:
| 参数 | 说明 |
|------|------|
| `nfield` | 随机场数量 (默认 8-16) |
| `nsc` | 输运标量数量 |
| `nsp` | 化学物种数 |
| `pdf_kappa` | TCR 模式标志 |

#### 3.2.2 小尺度混合模型: MIXER

详细见 [mixer.md](/tcr-manual/mixer/)

**TCR 混合模型公式**:

$$\beta = 0.5 \cdot f_{mixer} \cdot C_{\phi}$$

其中:
- $f_{mixer} = \frac{\Gamma_{SGS} + \nu}{\Delta_{TCR}^{2/3}}$
- $C_{\phi}$ 根据组分类型动态计算

#### 3.2.3 反应计算: REACTOR

详细见 [reactor.md](/tcr-manual/reactor/)

- **核心功能**: 并行 PSR 反应计算
- **负载均衡**: MPI 进程间高温单元分配
- **调用**: `react_hc` 执行实际化学反应
- **温度阈值**: 800K ~ 2800K

### 3.3 亚格子模型

详细见 [gamma_smagorinsky.md](/tcr-manual/gamma_smagorinsky/), [gamma_dyn_lilly.md](/tcr-manual/gamma_dyn_lilly/), [gamma_vreman.md](/tcr-manual/gamma_vreman/)

| 模型 | 说明 |
|------|------|
| Smagorinsky | 经典常数模型 |
| 动态 Lilly | 基于 Lilly 约束的动态模型 |
| 动态 Piomelli | 基于 Piomelli 约束的动态模型 |
| Vreman | Vreman 模型 |
| 模型 K | 湍流动能模型 |

### 3.4 边界条件

| 模块 | 功能 |
|------|------|
| [bndry1.md](/tcr-manual/bndry1/) | Dirichlet 边界条件 |
| [bndry2.md](/tcr-manual/bndry2/) | Neumann 边界条件 |
| [bndry3.md](/tcr-manual/bndry3/) | 速度边界条件 |
| [bndry_NSCBC.md](/tcr-manual/bndry_NSCBC/) | NSCBC 超声速边界 |
| [wall.md](/tcr-manual/wall/) | 壁面边界处理 |

**边界标记**:
| 标记 | 类型 |
|------|------|
| -1 | inflow (入口) |
| -2 | outflow zero-gradient (零梯度出口) |
| -21 | outflow convective (对流出口) |
| -3 | free-slip (自由滑移/对称) |
| -4, -40 | no-slip wall (无滑移壁面) |
| -41 | log-law instantaneous (瞬时壁面函数) |
| -42 | log-law mean (平均壁面函数) |

---

## 4. 数据结构

### 4.1 全局变量模块: MODULE_GLOBAL

详细见 [module_global.md](/tcr-manual/module_global/)

| 变量类型 | 示例 |
|----------|------|
| 字符变量 | `statfile`, `sgs_viscosity`, `species_output` |
| 整数参数 | `nvu=1`, `nvv=2`, `nvw=3`, `nvdp=4`, `nvf=5`, `nvh=6` |
| 逻辑变量 | `burn`, `read_restart`, `turbstat`, `radiate` |
| 实数变量 | `dtim`, `cflmax`, `cflmin`, `tim` |

### 4.2 主数组模块: MODULE_ARRAYS

详细见 [module_arrays.md](/tcr-manual/module_arrays/)

| 数组类别 | 数组名 |
|----------|--------|
| 边界标记 | `ibn`, `ibs`, `ibe`, `ibw`, `ibr`, `ibl` |
| 索引 | `io`, `jo`, `ko`, `nfo` |
| 网格坐标 | `x`, `y`, `z`, `xv`, `yv`, `zv`, `ajc` |
| 流场变量 | `rho`, `p`, `gam`, `u`, `v`, `w` |
| 系数矩阵 | `coef`, `work`, `gi`, `gj`, `gk` |
| 梯度 | `dpdx`, `dpdy`, `dpdz`, `dfdx`, `dfdy`, `dfdz` |

### 4.3 化学模块: MODULE_CHEMISTRY

详细见 [module_chemistry.md](/tcr-manual/module_chemistry/)

**TCR 特征数组**:
| 数组 | 说明 |
|------|------|
| `kappa(isp,ijk)` | PSR 体积分数 κ |
| `tim_flow(:)` | 流动时间尺度 |
| `temp_i(:)` | 积分尺度混合时间 |
| `temp_k(:)` | Kolmogorov 尺度混合时间 |
| `prev_rdot(:,:)` | 上一时间步的反应率 |
| `arr_eta(:)` | 反应物体积分数 η |

---

## 5. 输入与输出

### 5.1 VTK 可视化输出

详细见 [vtk.md](/tcr-manual/vtk/)

**输出变量**:
| 类别 | 变量 |
|------|------|
| 基本流场 | `Velocity`, `Density`, `Pressure`, `Temperature` |
| TCR 相关 | `Damkohler`, `kappa_{species}`, `RRmix_Oxygen`, `RRmix_Radical` |
| 统计量 | `{species}_mean`, `{species}_rms`, `Mean_U`, `Var_U` |

### 5.2 其他输出

| 模块 | 功能 |
|------|------|
| [output.md](/tcr-manual/output/) | 统计信息输出 |
| [probe.md](/tcr-manual/probe/) | 探针输出 |
| [statistics.md](/tcr-manual/statistics/) | 湍流统计 |

---

## 6. MPI 并行

详细见 [pbsrhl.md](/tcr-manual/pbsrhl/)

### 负载均衡策略

```
1. 统计各进程高温单元数 (nnchemc)
2. 计算平均负载: nm = (nt + ndoms - 1) / ndoms
3. 计算传输量: ntrans(ip) = nchemc(ip) - nm
4. 正值 → 发送方，负值 → 接收方
```

---

## 7. 代码文档索引

以下是目前已整理的代码文档（共 123 篇）:

### 求解器模块

- [boffin.md](/tcr-manual/boffin/) - 主程序
- [cgstab.md](/tcr-manual/cgstab/) - Bi-CGSTAB 求解器
- [cgsol.md](/tcr-manual/cgsol/) - PCG 求解器
- [condif.md](/tcr-manual/condif/) - 对流-扩散离散
- [press.md](/tcr-manual/press/) - 压力方程构建
- [update.md](/tcr-manual/update/) - 速度压力更新
- [step.md](/tcr-manual/step/) - 时间步进

### 燃烧模型

- [fieldpdf.md](/tcr-manual/fieldpdf/) - 随机场 PDF 方法
- [mixer.md](/tcr-manual/mixer/) - TCR 混合模型
- [reactor.md](/tcr-manual/reactor/) - 反应计算
- [react_hc.md](/tcr-manual/react_hc/) - 碳氢燃料反应求解
- [stochastic.md](/tcr-manual/stochastic/) - 随机过程

### 亚格子模型

- [gamma_smagorinsky.md](/tcr-manual/gamma_smagorinsky/) - Smagorinsky 模型
- [gamma_dyn_lilly.md](/tcr-manual/gamma_dyn_lilly/) - 动态 Lilly 模型
- [gamma_vreman.md](/tcr-manual/gamma_vreman/) - Vreman 模型

### 边界条件

- [bndry1.md](/tcr-manual/bndry1/) - Dirichlet 边界
- [bndry2.md](/tcr-manual/bndry2/) - Neumann 边界
- [bndry3.md](/tcr-manual/bndry3/) - 速度边界
- [wall.md](/tcr-manual/wall/) - 壁面处理

### 模块文件

- [module_global.md](/tcr-manual/module_global/) - 全局变量
- [module_arrays.md](/tcr-manual/module_arrays/) - 主数组
- [module_chemistry.md](/tcr-manual/module_chemistry/) - 化学模块

### 后处理

- [vtk.md](/tcr-manual/vtk/) - VTK 输出
- [output.md](/tcr-manual/output/) - 统计输出
- [statistics.md](/tcr-manual/statistics/) - 湍流统计
- [probe.md](/tcr-manual/probe/) - 探针输出

[查看完整文档列表 →](/tcr-manual/tcr-code-docs/)

---

## 8. 编译与运行

### 编译选项

```fortran
#define VTKBINARY      ! 二进制 VTK 输出
#define MEGAVTK        ! 调试输出所有变量
#define formation_rates  ! 输出反应率 (默认开启)
```

### 运行要求

| 要求 | 说明 |
|------|------|
| MPI | 需要支持 MPI 的编译器 |
| Fortran | Fortran 90+ 编译器 |
| 内存 | 取决于网格规模和随机场数量 |

---

*手册生成日期: 2026-03-26*

