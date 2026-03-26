# fieldpdf

# fieldpdf.F90 - 随机场 PDF 方法

> 源文件: `0.src.TCR.dyn728/fieldpdf.F90`
> 功能: 随机场 (Stochastic Field) PDF 方法实现，用于 LES 湍流燃烧模拟
> 算法: Ito 型随机微分方程 + 隐式时间积分

## 1. 概述

`fieldpdf` 子程序实现 **随机场方法 (Stochastic Field Method)**，基于 N. S. B. **Ito 型随机微分方程** 求解标量场方程：

$$\phi(\mathbf{x}, t) = \phi_0(\mathbf{x}) + \int_0^t \left[ S + \nabla \cdot (\Gamma \nabla \phi) \right] dt + \text{Wiener process}$$

该方法通过 $N$ 个随机场实现联合 PDF 传递，避免了闭合问题。

## 2. 核心算法流程

```
fieldpdf()
│
├─► stochastic()          ! 计算随机源项 (Wiener 过程)
│
├─► 随机场迭代 (ifld = 1 to nfield)
│   │
│   ├─► pbsrhl()          ! MPI 通信: γ 交换
│   ├─► gam_tvd()         ! TVD 格式计算扩散系数
│   │
│   └─► 标量方程求解 (jstep = 1,2)
│       ├─► bndry1()      ! 边界条件 (Dirichlet)
│       ├─► condif()     ! 对流-扩散系数构建
│       ├─► source_pdf()  ! 源项
│       ├─► bndry2()      ! 边界条件 (Neumann)
│       ├─► step()        ! 时间步进 (CN 格式)
│       ├─► mixer()       ! 小尺度混合模型
│       └─► cgstab()      ! 求解器
│
├─► checkmass()           ! 质量守恒检查
│
├─► reactor() / reactor_TCR()  ! 化学反应求解
│
└─► 混合分数计算 (Bilger 格式)
```

## 3. 关键参数

| 参数 | 说明 |
|------|------|
| `nfield` | 随机场数量 (默认 8-16) |
| `nsc` | 输运标量数量 (组分 + 焓) |
| `nsp` | 化学物种数 |
| `noise_reduction` | 是否启用随机噪声抑制 |
| `pdf_kappa` | TCR 模式标志 |

## 4. 随机场索引

F 数组中的随机场存储格式：

```
ifld = 0: 平均场 (fsc)
ifld = 1~nfield: 随机场
```

索引计算：
```fortran
nv = nf + ifld*nsc + isp  ! 变量索引
ijkp = ijk + nfo(nv)      ! 数组位置
```

## 5. TCR 模式特殊处理

当 `pdf_kappa = .true.` 时启用 TCR 模式：

### 5.1 反应率计算 (PSR 参考)
```fortran
! 预测步: prev_rdot = f(ifld=1~nfield) 的平均值
prev_rdot(isp,ijk) = sum(f(ifld))/real(nfield)
f(nf+isp,ijk) = prev_rdot(isp,ijk)  ! 存入平均场

! 调用 TCR 反应器
call reactor_TCR

! 修正步: 计算 PSR 反应率
prev_rdot(isp,ijk) = (f - prev_rdot)/dtim
f = f + prev_rdot*dtim
```

### 5.2 Re-MIX 机制

当以下条件满足时执行重混合：
- `rdot / prev_rdot > kw_max`
- `hdot / field_hdot(0) > kw_max`
- `hdot * field_hdot(0) <= 0` (符号变化)

其中：
```fortran
kw_max = 1/(4η(1-η)) + 0.30
η = xreact / (xnoble + xreact)  ! 反应物体积分数
arr_eta(ijk) = η                 ! 存储用于 κ 计算
```

## 6. 混合分数计算

### Bilger 格式
$$Z = \frac{2Y_C/W_C + 0.5Y_H/W_H + (Y_{O2}-Y_O)/W_O}{2Y_{C1}/W_C + 0.5Y_{H1}/W_H + Y_{O2}/W_O}$$

### 元素守恒格式
- C 基燃料：`Z = Y_C * W_fuel / atom(C, fuel)`
- H₂ 燃料：`Z = Y_H * W_fuel / atom(H, fuel)`

## 7. 输出变量

### 随机场相关
| 变量 | 描述 |
|------|------|
| `fsc(isp,ijk)` | 过滤值 (ifld=0) |
| `f(nf+ifld*nsc+isp)` | 随机场样本 (ifld>0) |
| `rdot(isp,ijk)` | 反应率 (ESF 滤波) |
| `prev_rdot(isp,ijk)` | PSR 参考反应率 |

### TCR 特有
| 变量 | 描述 |
|------|------|
| `arr_eta(ijk)` | 反应物体积分数 η |
| `field_hdot(ifld,ijk)` | 每场释热率 |
| `drhodt(ijk)` | 密度时间导数 |

## 8. 噪声抑制 (noise_reduction)

当启用时，预测步将所有随机场初始化为平均值：
```fortran
if (noise_reduction) then
  f(nf+ifld*nsc+isp) = fsc(isp,ijk)  ! 所有场 = 平均值
endif
```

修正步后再加回 drhodt 修正。

## 9. 调用关系

```
boffin.F90
  └─► fieldpdf()
        ├─► stochastic()       ! sgs_pdf 模块
        ├─► pbsrhl()           ! MPI 通信
        ├─► gam_tvd()          ! TVD 扩散系数
        ├─► bndry1/2/3()       ! 边界条件
        ├─► condif()           ! 离散格式
        ├─► source_pdf()       ! 源项
        ├─► step()             ! 时间推进
        ├─► mixer()            ! 小尺度混合
        ├─► cgstab()           ! 求解器
        ├─► reactor/reactor_TCR()  ! 化学反应
        ├─► checkmass()        ! 质量检查
        └─► CalcTemperature()  ! 温度计算
```

## 10. 关键公式索引

| 公式 | 位置 |
|------|------|
| 随机源项 (Ito) | `stochastic.F90` |
| 小尺度混合 | `mixer.F90` |
| TCR κ 计算 | `reactor.F90` |
| 反应率时间差分 | 行 140-150 |
| Re-MIX 条件 | 行 210-240 |

