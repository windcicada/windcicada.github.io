# stochastic

# stochastic.F90 - 随机源项 (Ito 过程)

> 源文件: `0.src.TCR.dyn728/stochastic.F90`
> 功能: 计算随机场 PDF 方法中的随机源项
> 公式: Ito 型随机微分方程

## 1. 概述

`stochastic` 子程序计算随机场方法中的 **Wiener 过程随机源项**，基于 Ito 型随机微分方程：

$$ d\phi = \left( S - \nabla \cdot (\Gamma \nabla \phi) \right) dt + \mathcal{N}(0, \sigma) dt^{1/2} $$

其中随机项体现湍流脉动对标量传递的影响。

## 2. 算法流程

```
stochastic()
│
├─► 边界限制检查
│   └─► fmin(nv) = max(fmin(nv), 0.0)  ! 物种浓度非负
│
├─► 网格循环 (ifld=1→nfield, isp=1→nsc)
│   │
│   ├─► 计算标量梯度 ∇f
│   │   └─► gradient(f, dfdx, dfdy, dfdz)
│   │
│   ├─► 计算随机速度幅值
│   │   vs = sqrt(2 * (γ_SGS/1.0 + μ*0.0) / (ρ*dt))
│   │
│   ├─► 生成随机通量
│   │   rhov = ρ * xrand(ifld, dim) * vs
│   │
│   ├─► 随机源项
│   │   S_stochastic = rhov · ∇f
│   │
│   └─► 限制检查 (防止越界)
│       factor = min((f_max-f)/(Δf), (f-f_min)/(Δf))
│       S_stochastic = factor * S_stochastic
│
└─► 入口边界处理
    └─► stochastic_source(ijk, :) = 0 (入口处)
```

## 3. 关键公式

### 3.1 随机速度幅值

$$ v_s = \sqrt{\frac{2(\gamma_{SGS} + \nu)}{\rho \cdot \Delta t}} $$

其中：
- γ_SGS: 亚格子扩散系数 (SGS 粘度 / Pr_t)
- ν: 分子运动粘度 (可选)
- ρ: 密度
- Δt: 时间步长

代码中的系数：
```fortran
vs = sqrt(2.0*(gam_sgs(ijk)/1.00+visc(ijk)*0.00)/(rho(ijk)*dtim))
```

### 3.2 随机通量

$$ \rho \mathbf{v}_s = \rho \cdot \mathbf{\xi} \cdot v_s $$

其中：
- $\mathbf{\xi} = xrand(ifld, 1:3)$: 预生成的高斯随机数
- 维度 1: X 方向
- 维度 2: Y 方向
- 维度 3: Z 方向

### 3.3 随机源项

$$ S_{stoch} = (\rho \mathbf{v}_s \cdot \nabla) \phi $$

展开为：
```fortran
stochastic_source(ijk,nv) = + rhovx * dfdx(ijk)  &
                            + rhovy * dfdy(ijk)  &
                            + rhovz * dfdz(ijk)
```

### 3.4 限制因子

为防止数值越界，引入限制因子：

$$ \delta f = \frac{\Delta t}{\rho} S_{stoch} $$

$$ factor = \min\left( \frac{f_{max} - f}{\delta f}, \frac{f - f_{min}}{\delta f}, 1.0 \right) $$

最终：
$$ S_{stoch} = factor \cdot S_{stoch} $$

## 4. 预生成随机数

随机数在 `start_pdf.F90` 中预生成：

```fortran
do ifld = 1, nfield
  do i = 1, 3
    call random_number(xrand(ifld, i))
    ! 转换为高斯分布 (Box-Muller if needed)
  enddo
enddo
```

## 5. MPI 边界处理

入口边界处随机源项设为零，防止非物理回流：

```fortran
! X 方向入口
if (ibs(j,k) /= -100) then
  i = 2
  stochastic_source(ijk,:) = 0.0
endif
```

## 6. 输出

| 变量 | 描述 |
|------|------|
| `stochastic_source(ijk, nv)` | 随机源项 (nfield*nsc 个变量) |

## 7. 调用关系

```
fieldpdf.F90
  └─► stochastic()
        ├─► gradient()    ! 标量梯度计算
        └─► (无)          ! 随机数 xrand 在 start_pdf 中生成
```

## 8. 物理意义

随机源项体现 **湍流脉动对标量输运的影响**：

- 高湍流强度 → 大 vs → 大随机源项
- 小时间步 → 大 vs (与 √Δt 成反比)
- 大梯度 → 大通量

这使得 PDF 方法能够捕捉湍流-化学相互作用。

## 9. 代码参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 随机数维度 | 3 | X, Y, Z 方向 |
| SGS Prandtl | 1.0 | 系数 1.00 |
| 分子粘度贡献 | 0.00 | 系数 0.00 |
| fmin 下限 | 0.0 | 物种浓度非负 |

## 10. 公式索引

| 内容 | 参考 |
|------|------|
| Ito 公式 | Pope (2000), Turbulent Flows |
| 随机源项 | S. B. Pope, "Mixing and Chemical Reactions in Turbulent Reacting Flows" |
| 数值限制 | Valiño (1998), "A Fast Operating Reactor Model" |

