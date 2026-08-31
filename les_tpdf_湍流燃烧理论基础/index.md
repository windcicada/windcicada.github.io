# 湍流燃烧大涡模拟：理论基础


> **系列导读**：本文介绍大涡模拟（LES）与输运概率密度函数（TPDF）方法的理论基础，重点说明过滤控制方程、化学源项闭合、欧拉随机场表示和微观混合闭合之间的关系。后续文章依次讨论[数值方法](/les_tpdf_numerical_procedure/)和[代码实现](/tcr-solver-manual/)。

---

## 1. 引言：为什么要用 LES-TPDF？

湍流燃烧是燃烧室、燃气轮机等设备中的核心物理过程。其难点在于：**湍流与化学反应之间的双向耦合**——湍流影响混合速率，化学反应改变密度和温度进而影响流动。

雷诺平均 Navier–Stokes（RANS）方法以统计平均量描述流动，不能直接保留全部瞬态大尺度结构。直接数值模拟（DNS）解析控制方程所覆盖的全部湍流尺度，但其计算成本随 Reynolds 数快速增长，通常难以用于工程尺度燃烧室。

大涡模拟（LES）解析主要含能尺度，并通过亚网格尺度（SGS）模型表示未解析尺度对过滤变量的作用。LES 的适用性取决于网格分辨率、SGS 闭合和边界条件，不能仅由其位于 DNS 与 RANS 之间来判断。

在反应流中，未解析的组分和温度涨落会影响过滤化学反应速率。输运概率密度函数（TPDF）方法演化联合组分分布，使非线性化学源项在样本空间中保持闭合；条件分子输运仍需微观混合模型封闭。

---

## 2. 控制方程组

### 2.1 连续方程与动量方程

一切始于流体力学的基本方程。连续方程：

$$\frac{\partial \rho}{\partial t} + \frac{\partial (\rho u_j)}{\partial x_j} = 0 \tag{1}$$

动量方程（Navier-Stokes）：

$$\frac{\partial (\rho u_i)}{\partial t} + \frac{\partial (\rho u_i u_j)}{\partial x_j} = -\frac{\partial p}{\partial x_i} + \frac{\partial \tau_{ij}}{\partial x_j} + F_i^{\text{IBM}} \tag{2}$$

其中 $\tau_{ij}$ 是粘性应力张量，对于牛顿流体：

$$\tau_{ij} = 2\mu S_{ij} - \frac{2}{3}\mu S_{kk}\delta_{ij}, \quad S_{ij} = \frac{1}{2}\left( \frac{\partial u_i}{\partial x_j} + \frac{\partial u_j}{\partial x_i} \right) \tag{2a}$$

> **物理意义**：$S_{ij}$ 是应变率张量，描述流体的变形速率。粘性应力与变形成正比，这就是牛顿流体的本构关系。

### 2.2 状态方程与分子粘度

理想气体状态方程：

$$\frac{p}{\rho} = \frac{R^0 T}{W} \tag{3}$$

其中 $R^0 = 8.314 \times 10^3\ \text{J/(kmol K)}$ 是通用气体常数，$T$ 是温度，$W$ 是分子量。

分子粘度随温度变化显著，空气的粘度可用 **Sutherland 定律**描述：

$$\mu(T) = \frac{1.45 T^{3/2}}{T + 110} \times 10^{-6} \tag{3a}$$

### 2.3 标量输运方程

对于多组分气体，物质浓度 $Y_\alpha$ 满足：

$$\frac{\partial (\rho Y_\alpha)}{\partial t} + \frac{\partial (\rho u_j Y_\alpha)}{\partial x_j} = \frac{\partial}{\partial x_j}\left( \rho \Gamma \frac{\partial Y_\alpha}{\partial x_j} \right) + \dot{\omega}_\alpha \tag{6}$$

其中：
- $Y_\alpha$：第 $\alpha$ 种组分的质量分数
- $\dot{\omega}_\alpha$：化学反应生成率（**这是封闭的关键**）
- $\Gamma = \mu/\text{Sc}$：等效扩散系数

混合物焓 $h$ 的输运方程：

$$\frac{\partial (\rho h)}{\partial t} + \frac{\partial (\rho u_j h)}{\partial x_j} = \frac{\partial}{\partial x_j}\left( \rho \Gamma \frac{\partial h}{\partial x_j} \right) + S_h \tag{8}$$

> **核心挑战**：方程 (6) 中的化学反应源项 $\dot{\omega}_\alpha$ 高度非线性，且依赖于所有组分浓度。在湍流条件下，$\dot{\omega}_\alpha$ 的平均值不等于用平均浓度计算的值——这就是**未闭合问题**。

### 2.4 通用形式

上述方程可以统一写成：

$$\frac{\partial (\rho \Phi)}{\partial t} + \frac{\partial (\rho u_j \Phi)}{\partial x_j} = \frac{\partial}{\partial x_j}\left( \Gamma \frac{\partial \Phi}{\partial x_j} \right) + S_\Phi \tag{10}$$

| 物理量 | $\Phi$ | $\Gamma$ | $S_\Phi$ |
|--------|--------|----------|----------|
| 连续方程 | $1$ | $0$ | $0$ |
| 动量 ($u_i$) | $u_i$ | $\mu$ | $-\partial p/\partial x_i + F_i^{\text{IBM}}$ |
| 标量 ($Y_\alpha, h$) | $Y_\alpha, h$ | $\rho\Gamma$ | $\dot{\omega}_\alpha, S_h$ |

---

## 3. 大涡模拟（LES）原理

### 3.1 滤波： LES 的核心操作

LES 的本质是**空间滤波**——用一个滤波器函数 $G$ 将物理量分解为：

$$\bar{\phi}(\mathbf{x}) = \int_D G(\mathbf{x}, \boldsymbol{\xi}) \phi(\boldsymbol{\xi}) d\boldsymbol{\xi} \tag{15}$$

- **大尺度量** $\bar{\phi}$：被直接求解
- **亚网格尺度量** $\phi'$：被模化

常用的 **盒式滤波器**（Box filter）：

$$\bar{\phi}(\mathbf{x}) = \frac{1}{V} \int_V \phi(\boldsymbol{\xi}) d\boldsymbol{\xi} \tag{16}$$

> **直观理解**：盒式滤波器就是求控制体内平均值。这与有限体积法的思想天然契合。

### 3.2 Favre 滤波：密度加权

燃烧中密度脉动显著，用密度加权滤波更方便：

$$\bar{\rho\phi} = \rho \tilde{\phi} \tag{17}$$

$$\phi = \tilde{\phi} + \phi'' \tag{18}$$

其中 $\tilde{\phi}$ 是 Favre 平均值，$\phi''$ 是脉动值。

### 3.3 过滤后的动量方程

将 Favre 滤波应用于动量方程 (2)：

$$\frac{\partial (\bar{\rho} \tilde{u}_i)}{\partial t} + \frac{\partial (\bar{\rho} \tilde{u}_i \tilde{u}_j)}{\partial x_j} = -\frac{\partial \bar{p}}{\partial x_i} + \frac{\partial \tilde{\tau}_{ij}}{\partial x_j} - \frac{\partial \tau_{ij}^{\text{SGS}}}{\partial x_j} + \bar{F}_i^{\text{IBM}} \tag{20}$$

其中 **亚格子应力张量**：

$$\tau_{ij}^{\text{SGS}} = \bar{\rho} \widetilde{u_i u_j} - \bar{\rho} \tilde{u}_i \tilde{u}_j \tag{22}$$

> **物理意义**：$\tau_{ij}^{\text{SGS}}$ 是未解决尺度对大尺度的动量输运——这是 LES 需要模化的核心项。

### 3.4 Smagorinsky 亚格子模型

最简单的亚格子模型是 **Smagorinsky 模型**：

$$\tau_{ij}^{\text{SGS}} - \frac{1}{3}\tau_{kk}^{\text{SGS}}\delta_{ij} = -2\mu_{\text{SGS}}\tilde{S}_{ij} \tag{23}$$

其中亚格子粘度：

$$\mu_{\text{SGS}} = \bar{\rho} C_S^2 \tilde{\Delta}^2 |\tilde{S}| \tag{24}$$

- $C_S \approx 0.1$：Smagorinsky 常数
- $\tilde{\Delta}$：滤波尺度（通常取网格特征长度）
- $|\tilde{S}| = \sqrt{2\tilde{S}_{ij}\tilde{S}_{ij}}$

> **直观的物理图像**：小尺度涡类似于"粘性"流体，亚格子粘度 $\mu_{\text{SGS}}$ 描述了这种湍流粘性。

### 3.5 动态亚格子模型

恒定 $C_S$ 的局限性明显。**动态模型**通过尺度相似性假设动态计算 $C_S$：

引入测试滤波器（尺度 $\hat{\Delta} = 2\Delta$ 或 $3\Delta$），定义：

$$\mathcal{L}_{ij} = \widehat{\bar{\rho}\tilde{u}_i \tilde{u}_j} - \hat{\bar{\rho}} \widehat{\tilde{u}}_i \widehat{\tilde{u}}_j \tag{26}$$

通过 **Germano 恒等式**：

$$\mathcal{L}_{ij} = \widehat{\tau_{ij}^{\text{SGS}}} - \tau_{ij}^{\widehat{\text{SGS}}} \tag{27}$$

最终得到 $C_S$ 的动态计算公式：

$$C_S^2 = \frac{\langle \mathcal{L}_{ij} \mathcal{M}_{ij} \rangle}{\langle \mathcal{M}_{ij} \mathcal{M}_{ij} \rangle} \tag{31}$$

其中 $\mathcal{M}_{ij} = \hat{\bar{\rho}} \hat{\Delta}^2 |\widehat{\tilde{S}}| \widehat{\tilde{S}}_{ij} - \bar{\rho} \tilde{\Delta}^2 |\tilde{S}| \tilde{S}_{ij}$。

> **适用边界**：动态过程根据解析尺度信息计算模型系数，但其表现仍受测试滤波、局部平均方式、网格质量和数值离散影响。

---

## 4. 概率密度函数（PDF）方法

### 4.1 为什么要用 PDF？

回到化学反应源项的未闭合问题：

$$\overline{\dot{\omega}_\alpha(Y_1, ..., Y_{N_s}, T)} \neq \dot{\omega}_\alpha(\overline{Y_1}, ..., \overline{Y_{N_s}}, \overline{T})$$

**原因**：化学反应是非线性的，平均后的反应速率不等于用平均量计算的反应速率。

**解决思路**：如果知道标量在亚网格上的概率密度函数 $\mathcal{P}$，则：

$$\overline{\dot{\omega}_\alpha} = \int \dot{\omega}_\alpha(\boldsymbol{\psi}) \mathcal{P}(\boldsymbol{\psi}) d\boldsymbol{\psi}$$

### 4.2 PDF 的定义

**累积分布函数（CDF）**：

$$F_\phi(\psi; \mathbf{x}, t) = P(\phi(\mathbf{x}, t) < \psi) \tag{33}$$

**概率密度函数（PDF）**：

$$\mathcal{P}_\phi(\psi; \mathbf{x}, t) = \frac{\partial F_\phi}{\partial \psi} \tag{34}$$

> **直观理解**：PDF 描述了标量取各个值的"概率权重"。

**细粒度 PDF**（确定时空的 Dirac 分布）：

$$\mathcal{P}_f^\phi(\psi; \mathbf{x}, t) = \delta(\psi - \phi(\mathbf{x}, t)) \tag{35}$$

### 4.3 联合 PDF 输运方程

对细粒度 PDF 应用链式法则，结合标量输运方程，可推导出：

$$\rho \frac{D \mathcal{P}_f}{Dt} = -\rho \sum_{\alpha=1}^{N_s} \frac{\partial}{\partial \psi_\alpha} \left( \dot{\phi}_\alpha \mathcal{P}_f \right) + \rho \sum_{\alpha=1}^{N_s} \frac{\partial^2}{\partial \psi_\alpha^2} \left( \Gamma \mathcal{P}_f \right) \tag{42}$$

**方程 (42) 的物理意义**：

| 项 | 含义 |
|----|------|
| 左端 | PDF 的输运（对流） |
| 第一项右端 | 化学反应源项（**核心**） |
| 第二项右端 | 分子扩散项 |

> **闭合关系**：在样本空间中，化学反应速率是组分状态的确定函数，因此化学源项保持闭合；条件扩散和微观混合仍需建模。

### 4.4 过滤密度函数（FDF）

对细粒度 PDF 进行 Favre 滤波，得到**亚网格过滤密度函数**：

$$\bar{\rho}\widetilde{\mathcal{P}}_f(\boldsymbol{\psi}; \mathbf{x}, t) = \int_V \rho(\mathbf{x}') G(\mathbf{x} - \mathbf{x}') \prod_{\alpha=1}^{N_s} \delta(\psi_\alpha - \phi_\alpha(\mathbf{x}', t)) d\mathbf{x}' \tag{45}$$

FDF 方程的最终形式：

$$\bar{\rho} \frac{\partial \mathcal{P}_f^\ast}{\partial t} + \bar{\rho} \tilde{u}_j \frac{\partial \mathcal{P}_f^\ast}{\partial x_j} + \sum_{\alpha=1}^{N_s} \frac{\partial}{\partial \psi_\alpha} \left( \bar{\rho} \dot{\phi}_\alpha \mathcal{P}_f^\ast \right) = \frac{\partial}{\partial x_j} \left( \bar{\rho} \Gamma_{\text{SGS}} \frac{\partial \mathcal{P}_f^\ast}{\partial x_j} \right) + \bar{\rho} \frac{\partial^2 (\Gamma_{\text{SGS}} \mathcal{P}_f^\ast)}{\partial \psi_\alpha^2} \tag{53}$$

---

## 5. 欧拉随机场方法：PDF 的数值求解

### 5.1 核心思想

直接求解高维 PDF 方程（维度 = 标量个数 + 空间维度）不可行。**欧拉随机场方法**用 $N$ 个随机标量场近似 PDF：

$$\mathcal{P}_\alpha(\psi_\alpha) = \frac{1}{N} \sum_{n=1}^{N} \delta(\psi_\alpha - \xi_\alpha^n) \tag{56}$$

其中 $\xi_\alpha^n(\mathbf{x}, t)$ 是第 $n$ 个随机场中的随机变量。

控制方程中的平均值：

$$\tilde{\phi}_\alpha = \frac{1}{N} \sum_{n=1}^{N} \xi_\alpha^n \tag{58}$$

### 5.2 随机场方程

通过 Fokker-Planck 类比，得到随机场输运方程：

$$\frac{\partial \xi_\alpha^n}{\partial t} = -\tilde{u}_j \frac{\partial \xi_\alpha^n}{\partial x_j} + \frac{\partial}{\partial x_j}\left( \Gamma \frac{\partial \xi_\alpha^n}{\partial x_j} \right) + \frac{1}{2\tau_{\text{mix}}}(\tilde{\phi}_\alpha - \xi_\alpha^n) + \sqrt{\frac{\Gamma}{\rho \tau_{\text{mix}}}} \frac{dW_j^n}{dt} \tag{59}$$

各项物理意义：

| 项 | 符号 | 物理意义 |
|----|------|----------|
| 对流扩散 | $\mathcal{C}_\alpha^n$ | 宏观流动输运 |
| 随机项 | $\mathcal{R}_\alpha^n$ | 亚网格湍流脉动（维纳过程） |
| 混合项 | $\mathcal{M}_\alpha^n$ | 分子尺度混合（IEM 模型封闭） |
|化学反应 | $\dot{\omega}_\alpha^n$ | 化学反应速率 |

### 5.3 维纳过程

$$dW_j^n \sim \mathcal{N}(0, \Delta t) \tag{61}$$

数值实现：

$$dW_j^n = \sqrt{\Delta t} \cdot \mathcal{N}(0, 1) \tag{62}$$

### 5.4 IEM 模型

**IEM（Interaction by Exchange with the Mean）模型**封闭混合项：

$$\mathcal{M}_\alpha^n = -\frac{1}{N} \sum_{m=1}^{N} \frac{\xi_\alpha^n - \xi_\alpha^m}{\tau_{\text{mix}}} \tag{63}$$

其中 $\tau_{\text{mix}} = C_\phi \tilde{\Delta}^2 / \Gamma$ 是亚网格混合时间尺度。

> **IEM 的局限性**：它假设所有随机场以相同速率向均值回归，无法描述混合的局部性特征。这也是 TCR 模型要解决的根本问题。

---

## 6. 混合物分数与火焰面模型

### 6.1 混合物分数

对于双燃料系统（燃料流 + 氧化剂流），定义**混合物分数** $\xi$：

$$\xi = \frac{Z_F - Z_{F,2}}{Z_{F,1} - Z_{F,2}} \tag{63a}$$

其中 $Z_m = \sum_n \mu_{mn} Y_n$ 是元素质量分数。

混合物分数满足守恒方程（无源项）：

$$\frac{\partial (\rho \xi)}{\partial t} + \frac{\partial (\rho u_i \xi)}{\partial x_i} = \frac{\partial}{\partial x_i} \left( \frac{\mu}{Pr} \frac{\partial \xi}{\partial x_i} \right) \tag{63c}$$

### 6.2 Beta-PDF

混合物分数的 FDF 常用 **Beta 函数**近似：

$$\widetilde{P}(\xi; \mathbf{x}, t) = \frac{\xi^{r-1} (1 - \xi)^{s-1}}{\int_0^1 \xi^{r-1} (1 - \xi)^{s-1} d\xi} \tag{63k}$$

参数由均值和方差确定：

$$r = \widetilde{\xi} \left[ \frac{\widetilde{\xi}(1 - \widetilde{\xi})}{\widetilde{\xi''^2}_{\text{SGS}}} - 1 \right], \quad s = \frac{1 - \widetilde{\xi}}{\widetilde{\xi}} r \tag{63l, 63m}$$

### 6.3 火焰面模型

**火焰面（Flamelet）模型**的核心假设：湍流火焰是一族层流火焰面的集合。

- **平衡假设**：当标量耗散率 $\chi$ 足够低时，火焰面内部达到化学平衡
- 热力学状态仅依赖 $\xi$ 和 $\chi$：

$$\rho = \check{\rho}(\xi), \quad T = \check{T}(\xi), \quad Y_\alpha = \check{Y}_\alpha(\xi) \tag{63p}$$

> **适用范围**：火焰面模型与 LES-FDF/TPDF 方法采用不同的闭合路径。后者不要求预先把全部热化学状态限制在给定火焰面流形上，但仍依赖微观混合、亚网格输运和数值离散模型。

---

## 7. TCR 微观混合模型

### 7.1 IEM 闭合的建模边界

Interaction by Exchange with the Mean（IEM）模型使每个随机场以同一局部时间尺度向 Favre 均值松弛。该闭合保持均值守恒并控制标量方差衰减，但交换对象和松弛速率不能由局部湍流–化学反应状态自动确定。

### 7.2 TCR 模型的层级

Turbulence–Chemistry Recursive（TCR）模型属于 TPDF/欧拉随机场方程中的微观混合闭合，而不是独立的流场求解器。TCR 关系使用反应速率比 $R$ 和有效反应物分数 $\eta$ 确定候选根，并在满足物理约束后恢复混合状态参数 $\kappa$。因此，$\kappa$ 是由可接受根关系恢复的闭合状态，不是直接输运的守恒标量，也不应等同于反应器分区的固定几何体积分数。

代数约化可能给出唯一可接受根、数学重根或多个可接受分支。唯一可接受根允许从当前 $(\eta,R)$ 状态直接恢复 $\kappa$；当存在多个可接受分支时，仅依赖瞬时状态不足以保持分支历史。

### 7.3 分支历史与当前证据边界

当前 TCR 表述以与混合状态参数 $\kappa$ 关联的变换变量 $s_\kappa$ 为历史变量。$s_\kappa$ 的输运方程提供分支延续信息，随后通过可接受性判断和直接代数恢复得到 $\kappa$。点态 DNS 候选根统计只能说明给定状态下根的可用性；这些统计本身不验证连续的 $s_\kappa$ 输运或跨越折叠点的分支延续。

本节说明 TCR 模型、数学表述和数值算法的层级。具体离散步骤见[数值方法](/les_tpdf_numerical_procedure/)，现有软件快照中的模块对应关系见[代码实现](/tcr-solver-manual/)。

---

## 8. 总结

LES-TPDF 方法把解析尺度流动、亚网格输运、联合组分分布和微观混合闭合组织在同一计算框架中：

1. **LES** 提供瞬态的空间分辨能力，捕捉大尺度湍流结构
2. **TPDF 方法** 使非线性化学反应源项在样本空间中保持闭合
3. **欧拉随机场** 将 PDF 方程转化为可解的随机微分方程
4. **TCR 模型** 根据局部湍流–化学反应状态恢复混合状态参数，并更新微观混合闭合

化学源项闭合并不意味着整个 TPDF 方程无须建模。亚网格输运、条件分子扩散、微观混合以及数值误差仍共同限定计算结果的适用范围。

**系列下一篇：** [湍流燃烧大涡模拟：数值方法](/les_tpdf_numerical_procedure/)

---

## 参考文献

1. 王煜栋. 基于LES-TPDF两相湍流燃烧模型的浸没边界方法研究[D]. 北京航空航天大学, 2023.
2. Wang, Y., et al. An improved immersed boundary method with local flow pattern reconstruction and its validation[J]. *Physics of Fluids*, 2024, 36(4).
3. Pope, S. B. Turbulent Flows[M]. Cambridge University Press, 2000.
4. Valiño, L. Field Monte Carlo formulation for calculating the probability density function of a reactive scalar in turbulent flow[J]. *Physics of Fluids*, 1998.


