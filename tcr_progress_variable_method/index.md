# LES-BOFFIN 反应进度变量与 TCR κ_c 诊断方法详解

  - TCR模型
type: post
featuredImage: ""
featuredImagePreview: ""
draft: false
---

# LES-BOFFIN 反应进度变量与 TCR κ_c 诊断方法详解

## 1. 研究背景

在大涡模拟（LES）与概率密度函数（PDF）方法结合的湍流燃烧模拟中，准确诊断燃烧状态和理解湍流-化学相互作用是重要课题。传统方法难以直接刻画反应进程和燃烧模式之间的耦合关系。

本文详细介绍基于**反应进度变量（Progress Variable）**的燃烧诊断方法，包括 TCR（湍流-化学递归）模型中 κ_c 的计算方法。

<!--more-->

## 2. 反应进度变量定义

### 2.1 C₃H₈ 燃烧的进度变量

对于丙烷（C₃H₈）空气燃烧，基于元素守恒的反应进度变量定义为：

$$c = \frac{X_{prod}}{X_{prod} + X_{react}}$$

其中：
- **产物摩尔分数**：$X_{prod} = 3X_{CO_2} + 4X_{H_2O} + X_{CO}$
- **反应物摩尔分数**：$X_{react} = X_{C_3H_8} + 0.2X_{O_2}$

化学方程式：$C_3H_8 + 5O_2 \rightarrow 3CO_2 + 4H_2O$

**物理意义**：$c=0$ 表示纯反应物，$c=1$ 表示完全燃烧产物。

### 2.2 瞬时值与滤波值

- **瞬时值** (`Progress_variable_instantaneous`)：从随机场样本 `fsc(isp,ijk)` 计算
- **滤波值** (`Progress_variable_filtered`)：从时间平均的物种浓度 `fschem` 计算

## 3. 反应进度变量变化率

### 3.1 滤波反应进度变化率

从 ESF（欧拉随机场）方法的滤波反应率计算：

$$\dot{c}_{filtered} = \dot{r}_{prod} - \dot{r}_{react}$$

其中 $\dot{r}$ 来自 `rdot(isp,ijk)`，是所有随机场样本的平均反应率。

### 3.2 PSR 参考反应进度变化率

从 TCR 模型的 PSR 参考反应率计算：

$$\dot{c}_{PSR} = \dot{r}_{prod}^{PSR} - \dot{r}_{react}^{PSR}$$

其中 $\dot{r}^{PSR}$ 来自 `prev_rdot(isp,ijk)`，是代入过滤均值计算的 PSR 反应率。

### 3.3 计算代码实现

```fortran
! 从 rdot 计算滤波 c_dot
rdot_prod = 3.0*rdot(jCO2,ijk) + 4.0*rdot(jH2O,ijk) + rdot(jCO,ijk)
rdot_react = rdot(jC3H8,ijk) + 0.2*rdot(jO2,ijk)
progress_c_dot_filtered = rdot_prod - rdot_react

! 从 prev_rdot 计算 PSR c_dot
rdot_prod = 3.0*prev_rdot(jCO2,ijk) + 4.0*prev_rdot(jH2O,ijk) + prev_rdot(jCO,ijk)
rdot_react = prev_rdot(jC3H8,ijk) + 0.2*prev_rdot(jO2,ijk)
progress_c_dot_psr = rdot_prod - rdot_react
```

## 4. TCR κ_c 模型

### 4.1 理论背景

TCR 模型通过 κ_c 表征控制体积内的湍流-化学平衡状态：

$$\kappa_c = \frac{1 + \sqrt{1 - 4\eta(1-\eta)\omega_{ratio}}}{2(1-\eta)}$$

其中：
- $\eta$ = `arr_eta`：反应物体积分数
- $\omega_{ratio} = \omega_{c,filtered} / \omega_{c,PSR}$：滤波与 PSR 反应进度变化率之比

### 4.2 数值稳定性处理

为保证数值计算稳定性，实现时加入以下保护措施：

```fortran
! 分母非零检查
if(abs(omega_c_psr) > small .and. eta > small .and. eta < (1.0-small)) then
    omega_ratio = omega_c_filtered / omega_c_psr
    term = 1.0 - 4.0*eta*(1.0-eta)*omega_ratio
    term = max(term, 0.0)  ! 确保 sqrt 参数非负
    sqrt_term = sqrt(term)
    kappa_c = (1.0 + sqrt_term) / (2.0*(1.0-eta))
    kappa_c = max(0.0, min(1.0, kappa_c))  ! 限制在 [0,1]
else
    kappa_c = 1.0  ! 默认值
endif
```

### 4.3 κ_c 的物理意义

- κ_c → 1：湍流-化学平衡（化学动力学主导）
- κ_c → 0：远离平衡（混合受限或局部熄火）

## 5. 局部燃烧模式分类

### 5.1 分类判据

基于湍流强度与层流火焰速度比 $u'/S_L$ 和 Karlovitz 数 Ka：

| 标志值 | 模式名称 | 英文 | 判据 |
|--------|----------|------|------|
| **0** | 无燃烧 | No Combustion | \|$\dot{c}$\| < 10⁻⁸ |
| **1** | 褶皱火焰面 | Wrinkled Flamelet | $\lg(u'/S_L) < 0$ |
| **2** | 波状火焰面 | Corrugated Flamelet | $\lg(u'/S_L) \geq 0$ 且 Ka < 1 |
| **3** | 薄反应区 | Thin Reaction Zone | 1 ≤ Ka < 100 |
| **4** | 破碎反应区 | Broken Reaction Zone | Ka ≥ 100 |

### 5.2 关键参数计算

**湍流脉动速度**：
$$u' = \sqrt{\frac{2k}{3}}$$

**湍流积分尺度**：
$$l_t = \frac{k^{3/2}}{\varepsilon}$$

**热火焰厚度**：
$$\delta = \frac{\mu}{\rho S_L}$$

**Karlovitz 数**：
$$Ka = \left(\frac{u'}{S_L}\right)^2 \cdot \frac{\delta}{l_t}$$

其中 $S_L = 0.40$ m/s（丙烷/空气化学计量比层流火焰速度）。

## 6. 标量 PDF 方差

### 6.1 从随机场样本计算

从 ESF 方法的 $N$ 个随机场样本计算标量方差：

$$\text{var}(\phi) = \frac{1}{N}\sum_{i=1}^{N} (\xi_i - \bar{\xi})^2$$

其中：
- $\xi_i$：第 $i$ 个随机场样本
- $\bar{\xi} = \frac{1}{N}\sum \xi_i$：网格平均

### 6.2 计算流程

```fortran
! 第一步：计算均值
do ifld = 1, nfield
    do ijk = lower, upper
        field_buffer(ijk) = field_buffer(ijk) + f(ijk+nfo(nv))
    enddo
enddo
field_buffer = field_buffer / real(nfield)

! 第二步：计算方差
do ifld = 1, nfield
    do ijk = lower, upper
        scalar_pdf_var(isp,ijk) = scalar_pdf_var(isp,ijk) + &
            (f(ijk+nfo(nv)) - field_buffer(ijk))**2
    enddo
enddo
scalar_pdf_var = scalar_pdf_var / real(nfield)
```

## 7. VTK 输出变量汇总

| VTK 变量名 | 含义 | 单位/范围 |
|------------|------|------------|
| `Progress_variable_filtered` | 滤波反应进度变量 | [0, 1] |
| `Progress_variable_instantaneous` | 瞬时反应进度变量 | [0, 1] |
| `Progress_variable_c_dot_filtered` | 滤波进度变化率 | mol/(m³·s) |
| `Progress_variable_c_dot_PSR` | PSR 参考进度变化率 | mol/(m³·s) |
| `kappa_c` | TCR κ_c 值 | [0, 1] |
| `u_prime_over_S_L` | 湍流/层流火焰速度比 | - |
| `l_t_over_delta` | 湍流尺度/火焰厚度比 | - |
| `Karlovitz_number` | Karlovitz 数 | - |
| `Combustion_mode_flag` | 燃烧模式标志 | 0-4 |
| `{species}_pdf_var` | 物种 PDF 方差 | - |

## 8. 代码实现要点

### 8.1 组分索引的动态查找

为保证代码通用性，使用组分名称动态查找索引：

```fortran
jC3H8 = 0; jCO2 = 0; jH2O = 0; jCO = 0; jO2 = 0
do isp = 1, nsp
    if(trim(names(isp)) == 'C3H8') jC3H8 = isp
    if(trim(names(isp)) == 'CO2')  jCO2  = isp
    if(trim(names(isp)) == 'H2O')  jH2O  = isp
    if(trim(names(isp)) == 'CO')   jCO   = isp
    if(trim(names(isp)) == 'O2')   jO2   = isp
enddo
```

### 8.2 rdot 与 prev_rdot 的区别

| 变量 | 模块 | 含义 |
|------|------|------|
| `rdot(isp,ijk)` | `sgs_pdf` | ESF 滤波反应率 |
| `prev_rdot(isp,ijk)` | `chemistry` | TCR PSR 参考反应率 |

## 9. 后续分析建议

1. **进度变量分布**：分析 `Progress_variable_filtered` 在火焰不同区域的分布特征
2. **燃烧模式统计**：统计各燃烧模式在火焰区域的占比，分析湍流-燃烧相互作用
3. **TCR κ_c 验证**：对比 `kappa_c` 与原有 `kappa(nsc,:)` 的差异，验证模型正确性
4. **PDF 方差验证**：对比 `{species}_pdf_var` 与传统湍流模型计算的方差
5. **熄火分析**：利用 `Combustion_mode_flag=0` 标识的区域分析局部熄火条件

---

## 参考文献

1. Pitsch, H. (2005). **Large-eddy simulation of turbulent combustion**. Annual Review of Fluid Mechanics.
2. Wang, Y. (2026). **TCR Micro-Mixing Model Documentation**. LES-BOFFIN.

---

*如有问题或建议，欢迎联系讨论。*

