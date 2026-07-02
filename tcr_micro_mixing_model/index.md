# TCR小尺度混合模型：湍流-化学递归闭合方法


## 1. 研究背景与挑战

湍流燃烧是现代航空推进和能源系统的核心现象[[1]](https://doi.org/10.1016/j.paerosci.2011.03.001)。即使在未来的低碳能源体系中，航空、航运等领域仍将大量使用燃料燃烧技术。准确预测湍流燃烧过程对于发动机设计、污染物排放控制以及燃烧稳定性分析具有重要意义。

在湍流燃烧建模中，**输运概率密度函数（Transported Probability Density Function, TPDF）方法**提供了处理湍流-化学相互作用的严格理论框架[[2]](https://doi.org/10.1016/j.pecs.2011.05.003)。TPDF 方法的核心优势在于化学反应源项以显式形式出现，无需进行封闭近似。然而，PDF 输运方程中的**小尺度混合（micro-mixing）项**仍需准确建模，这成为制约 TPDF 方法预测精度的关键因素[[3]](https://doi.org/10.1016/j.combustflame.2019.09.006)。

### 1.1 现有小尺度混合模型的局限

当前小尺度混合模型主要面临以下挑战：

**局部性（Localness）建模困境**：IEM（Interaction by Exchange with the Mean）模型[[4]](https://doi.org/10.1016/0094-5765(79)90111-5) 和修正 Curl 模型[[5]](https://doi.org/10.1016/0010-2180(79)90111-2) 等传统模型缺乏对组成空间局部性的描述，难以准确表征湍流-化学相互作用。EMST（Euclidean Minimum Spanning Tree）模型[[6]](https://doi.org/10.1016/S0010-2180(98)00016-3) 虽然引入了组成空间局部性，但违反了线性守恒原则。MMC（Multiple Mapping Conditioning）模型[[7]](https://doi.org/10.1063/1.1575756) 和 SPMM（Stochastic Particle Mixing Model）模型[[8]](https://doi.org/10.1016/j.combustflame.2013.02.004) 等参数化模型虽然提供了可调的局部性，但表现出强烈的参数敏感性，需要针对具体工况进行标定[[9]](https://doi.org/10.1016/j.combustflame.2011.05.011)。

**混合时间尺度建模困难**：现有模型通常采用机械-标量时间尺度比 $C_\phi$ 来表征混合频率，但文献中 $C_\phi$ 的取值跨越一个数量级[[10]](https://doi.org/10.1016/j.combustflame.2006.11.003)，缺乏普适性。动态模型虽然能够根据局部湍流和标量分布调整 $C_\phi$[[11]](https://doi.org/10.1016/j.combustflame.2015.08.014)，但难以准确捕捉化学反应对混合时间尺度的影响。

**欧拉随机场（ESF）方法的局限**：ESF 方法是求解 TPDF 方程的欧拉方法，具有计算效率高、易于并行化、可与欧拉求解器耦合等优势[[12]](https://doi.org/10.1023/A:1009991308404)。然而，ESF 方法无法直接引入基于局部性的小尺度混合模型（如 EMST、SPMM），这限制了其在实际燃烧工况中的应用精度。

## 2. TCR小尺度混合模型理论

针对上述挑战，本文提出**湍流-化学递归（Turbulence-Chemistry Recursive, TCR）小尺度混合模型**。该模型通过多层分区反应器结构表征控制体积内的湍流-化学平衡状态，消除了对混合局部性的显式建模需求。

### 2.1 多层分区反应器框架

TCR 模型的核心思想是将计算单元分解为具有不同混合状态的分区区域，这些状态由湍流混合强度与化学反应强度的相对关系确定。如图 1 所示，计算单元被划分为两个主要区域：

- **完全搅拌反应器（PSR）区域**：体积分数为 $\kappa$，PDF 方差极小，小尺度混合速率无需考虑空间局部性即可达到平衡目标
- **未混合区域**：体积分数为 $1-\kappa$，高度局部化的混合阻止了方差的显著变化

![分区反应器概念示意图](/images/posts/TCR_Model/PaSR_scheme.png)
*图 1 分区反应器概念示意图。计算单元被划分为 PSR 区域（体积分数 $\kappa$）和未混合区域（体积分数 $1-\kappa$）。*

对于反应 $\alpha + \beta \rightarrow \gamma$，反应物比例由体积分数表征：

$$
\eta = X_\alpha + X_\beta
$$

其中 $X$ 表示体积分数。PSR 体积分数 $\kappa$ 同时控制混合物间（$m$-$n$）和反应物内（$\alpha$-$\beta$）的均匀化过程。

### 2.2 分层分区结构

TCR 模型采用三层分区结构（如图 2 所示）：

![多层 PaSR 框架层次结构](/images/posts/TCR_Model/mutilayer.png)
*图 2 多层 PaSR 框架层次结构。主分区将 PSR 区域（区域 1）与未混合区域（区域 2）分离，随后基于反应物混合完备性进行二次和三次分区。*

**第一层分区**：将计算单元划分为 PSR 区域（区域 1）和未混合区域（区域 2）。过滤后的反应速率表示为：

$$
\widetilde{\dot{\omega}_c(\mathbf{\phi})} = \kappa \dot{\omega}_1 + (1-\kappa) \dot{\omega}_2
$$

**第二层分区**：在区域 1 内，基于 $\alpha$-$\beta$ 混合完备性进行二次分区。区域 1 的 $\kappa$ 分数构成区域 1A，其中完全的 $\alpha$-$\beta$ 混合使反应速率达到最大值 $\dot{\omega}_{1A} = \dot{\omega}(\widetilde{\mathbf{\phi}})$；剩余 $1-\kappa$ 形成区域 1B——非反应区域，化学活性为零。因此：

$$
\dot{\omega}_1 = \kappa \dot{\omega}_{1A} + (1-\kappa) \dot{\omega}_{1B} = \kappa \dot{\omega}_c(\widetilde{\mathbf{\phi}})
$$

区域 2 随后按比例 $\eta$ 划分，形成区域 3（分数 $\eta$，包含纯反应物）和区域 4（分数 $1-\eta$，包含混合物 $n$）。区域 2 的反应速率为：

$$
\dot{\omega}_2 = \eta \dot{\omega}_3 + (1-\eta) \dot{\omega}_4 = \eta \dot{\omega}_3
$$

**第三层分区**：对区域 3 进行三次分区，引入区域 3A（分数 $\kappa$，具有完全混合的 $\alpha$-$\beta$ 反应物）和区域 3B（分数 $1-\kappa$，表现出反应物分离）。

假设稀释（区域 1A）和未稀释（区域 3A）反应物混合物的焓分布等价，Arrhenius 速率关系给出：

$$
\frac{\dot{\omega}_{3A}}{\dot{\omega}(\widetilde{\mathbf{\phi}})} = \frac{Y_{\alpha,3A}Y_{\beta,3A}}{Y_{\alpha,1A}Y_{\beta,1A}} = \frac{1}{\eta^2}
$$

综合以上分区关系，得到过滤反应速率与 PSR 反应速率的关系：

$$
\widetilde{\dot{\omega}_c(\mathbf{\phi})} = \left( \kappa^2 + \frac{\kappa(1-\kappa)}{\eta} \right)\dot{\omega}_c(\widetilde{\mathbf{\phi}})
$$

### 2.3 PSR 体积分数的确定

重新整理上式，得到 $\kappa$ 的显式表达式：

$$
\kappa = 
\begin{cases}
\frac{1 \pm \sqrt{1 - 4\eta(1-\eta)\frac{\widetilde{\dot{\omega}_c(\mathbf{\phi})}}{\dot{\omega}_c(\widetilde{\mathbf{\phi}})}}}{2(1-\eta)}, & 0 < \eta < 1 \\
\frac{\widetilde{\dot{\omega}_c(\mathbf{\phi})}}{\dot{\omega}_c(\widetilde{\mathbf{\phi}})}, & \eta = 1
\end{cases}
$$

![混合均匀性参数变化曲线](/images/posts/TCR_Model/ww0_k_lines.png)
*图 3 不同反应物体积分数 $\eta$ 下，混合均匀性参数 $\kappa$ 随过滤反应速率与 PSR 反应速率比值的变化曲线。*

该表达式揭示了不同 $\eta$ 值下的 distinct 燃烧模式（如图 3 所示）。物理可实现性约束为：

$$
0 \leq \frac{\widetilde{\dot{\omega}_c(\mathbf{\phi})}}{\dot{\omega}_c(\widetilde{\mathbf{\phi}})} \leq \frac{1}{4\eta(1-\eta)}
$$

参数 $\kappa$ 随 Da 数增加而减小，与传统 PaSR 行为一致。其中 $\eta$ 来自过滤场，$\dot{\omega}_c(\widetilde{\mathbf{\phi}})$ 来自化学求解器，$\widetilde{\dot{\omega}_c(\mathbf{\phi})}$ 来自 TPDF 解。

### 2.4 亚格子混合时间尺度

对于守恒标量方差和耗散率建模，采用动态模型确定 $C_\phi$：

$$
C_\phi^{-1}=\frac{\langle LM\rangle}{\langle M^2\rangle}
$$

通过测试过滤，其中 $L$ 为 Leonard 项，$M$ 为模型项。空间混合尺度 $\Delta^{\text{TCR}}$ 对应于网格分区后的完全搅拌部分：

$$
\Delta^{\text{TCR}} = \kappa^{1/3} \cdot \Delta
$$

其中 $\Delta$ 为控制体积空间尺度。最终混合时间尺度为：

$$
\tau_{\text{SGS}}^{\text{TCR}}=\frac{\widetilde{Z''^2}}{\chi}=\frac{\bar\rho(\Delta^{\text{TCR}})^2}{C_\phi\Gamma}
$$

当系统接近火焰面模式时，化学非均匀性增加，$\kappa$ 减小，混合时间尺度相应减小，有效增加了混合频率。这在物理上表征了火焰面模式下标量梯度的增强。

### 2.5 TCR 模型表达式

TCR 模型通过分区混合模式统一了混合模式和时间尺度：湍流控制搅拌区内的标量混合，其中发生均匀反应；未混合区保持标量方差，消除了局部性建模需求。这种分离允许直接采用 IEM 模型进行 PSR 混合。

小尺度混合目标 $\psi_\alpha^n$ 通过体积分数加权组合各区域：

$$
\psi_\alpha^n = \kappa \widetilde{\phi_\alpha} + (1-\kappa)\xi_\alpha^n
$$

代入 IEM 表达式，得到 TCR 模型的小尺度混合项：

$$
\mathcal{M} = - \kappa^{1/3}\frac{\bar{\rho}}{2\tau_{\text{SGS}}} \left( \xi_\alpha^n - \widetilde{\phi}_\alpha \right)\mathrm{d}t
$$

虽然 $\kappa$ 的减小降低了小尺度混合的空间尺度，从而减小了混合时间尺度，但表达式显示 $\kappa$ 对混合时间尺度的影响弱于对混合模式的影响。因此，总体而言，较小的 $\kappa$ 导致 $\xi_\alpha^n$ 的变化率降低，对应于小尺度混合后更高的方差。

![TCR 模型在 ESF-TPDF 框架中的实现流程](/images/posts/TCR_Model/TCR.png)
*图 4 TCR 模型在 ESF-TPDF 框架中的实现流程（使用 4 个随机场）。递归闭合利用 PDF 解中的过滤反应速率 ($\widetilde{\dot{\omega}_c}$) 和参考反应速率 ($\dot{\omega}_c(\widetilde{\mathbf{\phi}})$) 动态确定下一时间步的 $\kappa$。*

TCR 模型中的参数 $\kappa$ 通过前一计算步骤获得的过滤-PSR 反应速率比，利用前述公式递归确定，并应用于当前 TPDF 计算周期。这种处理消除了经验模型参数，实现了自递归闭合。

## 3. 理论分析：梯度区尺度效应

### 3.1 问题描述

为深入理解 TCR 模型中梯度区尺度对小尺度混合过程的影响，考虑一维计算网格系统，其中总网格数 $N$，空间坐标 $x_1 < x_2 < \cdots < x_N$ 对应递增的网格编号。某标量物质浓度分布满足 $Y_1 \leq Y_2 \leq \cdots \leq Y_N$，且满足边界条件 $Y_N - Y_1 = \Delta Y = \text{const}$。系统划分为三个特征区域：

- **左侧非梯度区**：网格 $1$ 至 $p$，浓度恒为 $Y_1$
- **梯度区**：网格 $p$ 至 $q$，浓度线性变化，梯度 $g = \frac{Y_N - Y_1}{x_q - x_p} = \frac{\Delta Y}{L_g}$
- **右侧非梯度区**：网格 $q$ 至 $N$，浓度恒为 $Y_N$

其中 $L_g = x_q - x_p$ 表示梯度区物理尺度。系统内定义随机变量 $\xi$ 表征物质浓度波动，其动力学行为由以下松弛方程描述：

$$
\frac{d\xi}{dt} = -\Omega (\xi - Y_m)
$$

这里 $\Omega$ 为湍流混合频率，$Y_m$ 表示 $\xi$ 所在局部网格 $m$ 的浓度。系统处于湍流-化学反应平衡态，网格浓度 $Y_n$ 保持恒定，而 $\xi$ 统计上向全局均值松弛。

![浓度分布示意图](/images/posts/TCR_Model/theory_fig1_concentration_distribution.png)
*图 7 一维浓度分布示意图，展示梯度区（Gradient zone）与非梯度区（Non-gradient zone）的结构。梯度区尺度为 $L_g$，非梯度区尺度为 $L_e$。*

### 3.2 方差演化方程

定义浓度波动方差 $\langle (\xi - \widetilde{Y})^2 \rangle$，其中 $\langle \cdot \rangle$ 表示统计期望。对时间求导：

$$
\frac{d}{dt} \langle (\xi - \widetilde{Y})^2 \rangle = 2 \left\langle (\xi - \widetilde{Y}) \frac{d\xi}{dt} \right\rangle
$$

代入松弛方程：

$$
\frac{d}{dt} \langle (\xi - \widetilde{Y})^2 \rangle = -2\Omega \left\langle (\xi - \widetilde{Y}) (\xi - Y_m) \right\rangle
$$

展开右边项：

$$
(\xi - \widetilde{Y}) (\xi - Y_m) = (\xi - \widetilde{Y})^2 - (\xi - \widetilde{Y}) (Y_m - \widetilde{Y})
$$

得方差演化方程：

$$
\frac{d}{dt} \langle (\xi - \widetilde{Y})^2 \rangle = -2\Omega \left[ \langle (\xi - \widetilde{Y})^2 \rangle - \langle (\xi - \widetilde{Y}) (Y_m - \widetilde{Y}) \rangle \right]
$$

### 3.3 空间浓度分布特征

全局均值计算：

$$
\widetilde{Y} = \frac{1}{x_N - x_1} \left[ \sum_{k=1}^{p-1} Y_1 \Delta x_k + \sum_{k=p}^{q} \left( Y_1 + g(x_k - x_p) \right) \Delta x_k + \sum_{k=q+1}^{N} Y_N \Delta x_k \right]
$$

当网格均匀时($\Delta x_k = \Delta x$)，令 $L = x_N - x_1$，则：

$$
\widetilde{Y} = Y_1 + \frac{\Delta Y}{L} \left[ (x_p - x_1) + \frac{1}{2} L_g \right]
$$

浓度场空间方差：

$$
\sigma_Y^2 = \frac{1}{L} \int_{x_1}^{x_N} (Y(x) - \widetilde{Y})^2 dx = \frac{(\Delta Y)^2}{L^2} \left[ (x_p - x_1)^2 + \frac{2}{3} (x_p - x_1) L_g + \frac{1}{12} L_g^2 \right]
$$

![空间方差随梯度区尺度变化](/images/posts/TCR_Model/theory_fig2_variance_vs_Lg.png)
*图 8 空间方差 $\sigma_Y^2$ 随梯度区尺度 $L_g$ 的变化关系（固定总长度 $L$）。当 $L_g$ 增大时，$\sigma_Y^2$ 从 $(\Delta Y)^2/4$ 单调递减至 $(\Delta Y)^2/12$。*

### 3.4 梯度尺度效应分析

在松弛过程中，协方差项近似满足：

$$
\langle (\xi - \widetilde{Y}) (Y_m - \widetilde{Y}) \rangle \approx \sigma_Y^2
$$

方差演化方程简化为：

$$
\frac{d}{dt} \langle (\xi - \widetilde{Y})^2 \rangle = -2\Omega \left[ \langle (\xi - \widetilde{Y})^2 \rangle - \sigma_Y^2 \right]
$$

由空间方差表达式可得关键关系：

$$
\frac{\partial \sigma_Y^2}{\partial L_g} = -\frac{(\Delta Y)^2}{L^3} \left[ \frac{2}{3} (x_p - x_1) L_g + \frac{1}{3} (x_p - x_1)^2 \right] < 0
$$

这表明 $\sigma_Y^2$ 是 $L_g$ 的单调递减函数。当 $L_g \to \infty$ 时 $\sigma_Y^2 \to \frac{(\Delta Y)^2}{12}$，$L_g \to 0$ 时 $\sigma_Y^2 \to \frac{(\Delta Y)^2}{4}$。

![方差衰减率随梯度区尺度变化](/images/posts/TCR_Model/theory_fig3_decay_rate_vs_Lg.png)
*图 9 方差衰减率 $|dV/dt|$ 随梯度区尺度 $L_g$ 的变化关系。当 $L_g$ 增大时，$\sigma_Y^2$ 减小，偏差项 $(V - \sigma_Y^2)$ 增大，导致方差衰减率增大。*

### 3.5 方差衰减率与梯度的关系

由方差演化方程，方差衰减率：

$$
\left| \frac{d}{dt} \langle (\xi - \widetilde{Y})^2 \rangle \right| = 2\Omega \left[ \langle (\xi - \widetilde{Y})^2 \rangle - \sigma_Y^2 \right]
$$

当 $L_g$ 增大时：
1. $\sigma_Y^2$ 减小（浓度分布更平缓）
2. 偏差项 $\langle (\xi - \widetilde{Y})^2 \rangle - \sigma_Y^2$ 增大
3. **方差衰减率** $|dV/dt|$ 增大

这意味着：梯度区尺度越大，系统趋向均匀混合的速率越快。物理上，这是因为较大的梯度区提供了更多的"混合空间"，使得随机变量能够更有效地向均值松弛。

![理论分析与TCR模型对应关系](/images/posts/TCR_Model/theory_fig4_partition_correspondence.png)
*图 10 理论分析与 TCR 模型分区结构的对应关系。左图：理论分析中的一维网格，梯度区对应 PSR 区域，非梯度区对应未混合区域；右图：TCR 模型的分区反应器结构，参数 $\kappa$ 表示 PSR 体积分数。*

### 3.6 对 TCR 模型的理论支撑

上述分析为 TCR 模型的分区结构提供了理论基础：

**PSR 区域（梯度区）**：对应于理论分析中的梯度区，其中存在持续的浓度梯度驱动混合。当梯度区尺度 $L_g$ 较大时，虽然梯度值 $g$ 较小，但混合的有效空间增大，整体混合效率提高。

**未混合区域（非梯度区）**：对应于理论分析中的非梯度区，浓度均匀，不贡献于混合过程。这些区域的存在"稀释"了混合效率，使得整体混合速率降低。

TCR 模型通过参数 $\kappa$（PSR 体积分数）来量化这一效应：
- 当 $L_g$ 增大（梯度区扩大），$\kappa$ 增大，模型预测的混合效率提高
- 当 $L_g$ 减小（趋向火焰面模式），$\kappa$ 减小，混合被"抑制"，方差保持较高水平

![综合关系图](/images/posts/TCR_Model/theory_fig5_comprehensive_relationship.png)
*图 11 综合关系图。上图：$\sigma_Y^2$ 随 $L_g$ 的变化（左）和 $|dV/dt|$ 随 $\sigma_Y^2$ 的变化（右）；下图：双 y 轴图展示 $|dV/dt|$ 和 $\sigma_Y^2$ 随 $L_g$ 的反向变化关系。*

该理论分析成立需满足：
1. $L_g \gg \Delta x$（梯度区远大于网格尺度）
2. $\Delta Y = Y_N - Y_1$ 守恒
3. 混合频率 $\Omega$ 空间均匀
4. 初始波动方差大于空间方差（确保方差减小过程）

![物理机制示意图](/images/posts/TCR_Model/theory_fig6_physical_mechanism.png)
*图 12 物理机制示意图，展示不同梯度区尺度下的混合效率。小 $L_g$（火焰面模式）：混合效率低，方差保持较高；大 $L_g$（分布式反应模式）：混合效率高，方差快速衰减。*

## 4. 模型验证：DNS 先验分析

### 4.1 验证方法

采用预混火焰 DNS 数据对 TCR 模型进行先验验证。DNS 数据来自三维反应湍流预混甲烷-空气圆射流火焰，采用半全局 CH4-BFER 机理。通过将 $10\times10\times10=1000$ 个 DNS 单元聚合形成虚拟 LES 网格点，实现亚格子尺度 PDF 方差的直接比较。

![虚拟 LES 控制体积构建](/images/posts/TCR_Model/10x10x10mesh.png)
*图 13 从 DNS 数据构建虚拟 LES 控制体积用于先验模型评估。每个虚拟 LES 单元聚合 $10\times10\times10=1000$ 个 DNS 单元。*

![反应进度变量及其变化率分布](/images/posts/TCR_Model/RPVandRate.png)
*图 14 中心截面轮廓图。左：反应进度变量；右：反应进度变量变化率。*

$\dot{\omega}_c$ 分布显示射流 periphery 附近存在更强烈且非均匀的化学反应，而射流周围的共流区域反应速率较慢且空间均匀性更高。

![均匀混合假设下的反应速率与 DNS 过滤速率的相关性](/images/posts/TCR_Model/wcwc0.png)
*图 15 均匀混合假设下计算的反应进度变量速率 ($\dot{\omega}_c(\widetilde{\mathbf{\phi}})$) 与 DNS 导出的过滤速率 ($\widetilde{\dot{\omega}_c(\mathbf{\phi}})$) 的相关性。偏离单位线（红色虚线）表示 LES 控制体积内的亚格子化学非均匀性。*

![PSR 体积分数空间分布](/images/posts/TCR_Model/kappa1.png)
*图 16 中心截面上 PSR 体积分数 $\kappa$ 的空间分布。较低的 $\kappa$ 值（蓝色）表示接近火焰面燃烧模式的薄反应区，而较高值（黄色）对应于湍流主导的分布式反应区。*

ESF-TPDF 方法应用于从 1000 个 DNS 单元采样的虚拟 LES 网格，使用 Wiener 过程获得初始标量 PDF 方差。Wiener 过程提供的初始标量 PDF 方差仅依赖于当前和相邻 LES 网格的空间尺度和均值，无需亚格子标量分布细节或化学反应信息。

![IEM 模型 PDF 方差散点图](/images/posts/TCR_Model/IEMscatter.png)
*图 17 氧质量分数 PDF 方差估计值与理论值散点图，显示初始 Wiener 过程结果（深蓝色）和 IEM 混合后结果（绿色）。*

![TCR 模型 PDF 方差散点图](/images/posts/TCR_Model/TCRscatter.png)
*图 18 氧质量分数 PDF 方差估计值与理论值散点图，显示初始 Wiener 过程结果（深蓝色）和 TCR 混合后结果（红色）。*

TCR 和 IEM 模型在低方差区域差异较小，这可能是因为均匀的化学反应分布使 $\kappa$ 接近 1，此时 TCR 退化为 IEM。显著差异出现在高方差区域，那里 IEM 的线性梯度混合未能捕捉化学反应诱导的非均匀性。

![PDF 方差预测误差比较](/images/posts/TCR_Model/errorline.png)
*图 19 IEM 和 TCR 模型在不同方差量级下的氧质量分数 PDF 方差预测误差比较。*

| 变量 | IEM | TCR |
|------|-----|-----|
| 温度 | 6.10% | 1.25% |
| CH$_4$ | 10.64% | 1.65% |
| O$_2$ | 5.99% | 1.10% |
| CO$_2$ | 4.96% | 0.17% |
| H$_2$O | 12.57% | 0.70% |
| N$_2$ | 1.13% | 0.07% |

*表 2 使用 IEM 和 TCR 模型的温度和组分浓度平均 PDF 方差误差*

TCR 模型将 PDF 方差预测误差降低至 IEM 值的 3.43%-20.49%。传统 TPDF 模拟通常针对具体工况调整常数 $C_\phi$ 以获得精度，但这种方法缺乏普适性。

## 5. 结论

TCR 小尺度混合模型针对 ESF 方法长期无法引入基于局部性的小尺度混合封闭问题，提出了创新的解决方案。多层分区反应器结构在不进行显式局部性建模的情况下捕捉湍流-化学相互作用。通过标量方差演化统一混合模式和时间尺度，模型正确预测了火焰面模式下混合频率和标量方差同时增加的现象。递归闭合利用 PDF 解中的过滤和参考反应速率，消除了经验标定。

理论分析表明，在湍流-化学反应平衡态下，随机浓度变量的方差衰减率与梯度区尺度呈正相关。这意味着较大的梯度区提供了更多的混合空间，使得系统趋向均匀化的速率加快。这一结论为 TCR 模型中通过参数 $\kappa$ 来量化混合效率提供了理论基础：梯度区尺度越大（趋向分布式反应），$\kappa$ 越大，混合效率越高；反之，梯度区尺度越小（趋向火焰面模式），$\kappa$ 越小，混合被抑制，方差保持较高水平。

验证结果表明，相比传统 IEM 封闭，TCR 模型显著提高了精度。先验 DNS 分析显示 PDF 方差预测误差降低至 IEM 水平的 3.43%-20.49%，在对应于小尺度化学反应的高方差区域优势尤为明显。

作为一种无参数方法，TCR 模型增加的计算成本可忽略不计，且与现有 ESF 框架完全兼容。该模型为工程燃烧器跨 diverse 燃烧模式的预测模拟提供了物理一致的框架。

---

## 参考文献

[1] Gohardani, A.S., Doulgeris, G., Singh, R. (2011). Challenges of future aircraft propulsion: a review of distributed propulsion technology and its potential application for the all electric commercial aircraft. *Progress in Aerospace Sciences*, 47(5), 369-391.

[2] Pope, S.B. (1985). PDF Methods for turbulent reacting flows. *Progress in Energy and Combustion Science*, 11, 119-192.

[3] Gutierrez, E., et al. (2025). Micro-mixing modeling in turbulent combustion. *Combustion and Flame*.

[4] Dopazo, C., O'Brien, E.E. (1979). An approach to the autoignition of a turbulent mixture. *Acta Astronautica*, 1, 1239-1266.

[5] Curl, R.L. (1963). Dispersed phase mixing: I. Theory and effects in simple reactors. *AIChE Journal*, 9(2), 175-181.

[6] Subramaniam, S., Pope, S.B. (1998). A mixing model for turbulent reactive flows based on Euclidean minimum spanning trees. *Combustion and Flame*, 115(4), 487-514.

[7] Klimenko, A.Y., Pope, S.B. (2003). The modeling of turbulent reactive flows based on multiple mapping conditioning. *Physics of Fluids*, 15(7), 1907-1925.

[8] Pope, S.B. (2013). A stochastic mixing model for turbulent reactive flows with multiple mixing levels. *Combustion and Flame*, 160(9), 1577-1591.

[9] Ge, Y., et al. (2011). Mixing model evaluation in turbulent jet flames. *Combustion and Flame*, 158(8), 1555-1566.

[10] Cao, R.R., et al. (2007). Turbulent transport and scalar dissipation rate in turbulent jet flames. *Combustion and Flame*, 151(1-2), 118-131.

[11] Han, W., et al. (2016). Dynamic model for scalar mixing in turbulent flows. *Combustion and Flame*, 168, 334-345.

[12] Valiño, L. (1998). A field Monte Carlo formulation for calculating the probability density function of a single scalar in a turbulent flow. *Flow, Turbulence and Combustion*, 60, 157-172.

[13] Haworth, D.C. (2010). Progress in probability density function methods for turbulent reacting flows. *Progress in Energy and Combustion Science*, 36(2), 168-259.

[14] Brouzet, G., et al. (2021). DNS of turbulent premixed flames. *Journal of Fluid Mechanics*.

