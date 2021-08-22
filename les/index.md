# LES


# 大涡模拟

## 基础方程

{{< admonition type=tip title="张量" open=false >}}
$u_i=u_x\vec{i}+u_y\vec{j}+u_z\vec{k}$
$\tau_{ij}=\begin{bmatrix}\tau_{11}&\tau_{12}&\tau_{13}\\\ \tau_{21}&\tau_{22}&\tau_{23}\\\ \tau_{31}&\tau_{32}&\tau_{33}\end{bmatrix}$
$u_i x_i=u_1 x_1 + u_2 x_2 +u_3 x_3$
{{< /admonition >}}

{{< admonition type=note title="坐标变换" open=false >}}

| 坐标轴名 | 原始坐标系 | 变换后坐标系 |
| :---: | :---: | :---: |
| $x$ |  $x_1$ |$\xi_1$|
| $y$ |  $x_2$ |$\xi_2$|
| $z$ |  $x_3$ |$\xi_3$|

坐标变换 Jacobian 矩阵 $J_{ij}=\dfrac{\partial x_i}{\partial\xi_i}$

其代数余子式 $A=|J||J|^{-1}$

> 根据链式法则，有 $\dfrac{\partial \phi}{\partial x_i}=\dfrac{A_{ij}}{|J|}\dfrac{\partial \phi}{\partial\xi_j}$

由于任何坐标变换都不存在 $\dfrac{\partial \frac{A_{ik}}{|J|}}{\partial\xi_k}$ 

{{< /admonition >}}

* **质量守恒方程 (连续方程)**

  $\dfrac{\partial \rho}{\partial t}+\dfrac{\partial \rho u_i}{\partial x_i}$

  {{< admonition type=info title="连续方程形式" open=false >}}
  
  欧拉形式: $\dfrac{\partial \rho}{\partial t}+\nabla(\rho \vec{V})=0$

  含义: 控制体质量的变化等于流入控制体的质量

  拉格朗日形式: $\dfrac{D\rho}{Dt}+\rho(\nabla\vec{V})=0$

  含义: 体系的密度由变化体系的体积变化引起+
  {{< /admonition >}}


* **动量守恒方程**

  $\dfrac{\partial\rho u_i}{\partial t}+\dfrac{\partial\rho u_i u_j}{\partial x_j}=-\dfrac{\partial P}{\partial x_i}+\dfrac{\partial \sigma_{ij}}{\partial x_i}+\rho g_i$

  {{< admonition type=tip title="应力张量 $\sigma_{ij}$" open=false >}}

  $\sigma_{ij}=2\mu S_{ij}-\frac{2}{3}\mu S_{kk}\delta_{ij}$

  对牛顿流体,应力张量的分量可以分解为分子黏度和局部速度梯度的函数

  分子黏度 $\mu$ 依赖于温度 $T$,由Sutherland定律等幂律给出

  {{< /admonition >}}

  {{< admonition type=info title="动量方程形式" open=false >}}

  拉格朗日形式: $\dfrac{D\vec{V}}{Dt}=-\dfrac{\mu}{\rho}\nabla^2\vec{V}+\dfrac{1}{3}\dfrac{\mu}{\rho}\nabla(\nabla \vec{V})-\dfrac{1}{\rho}\nabla P+\vec{f_b}$

  含义: 体系动量变化 = 粘性正应力项+粘性切应力项+压差力项+体积力项

  {{< /admonition >}}

* **密度状态方程**

  $\dfrac{P}{\rho}=\dfrac{R^0T}{W}$    其中，$R^0$为气体通用常数，$W$为流体分子量

  {{< admonition type=tip title="密度状态方程与能量方程" open=false >}}

  **质量守恒方程**和**动量守恒方程**中的密度$\rho$为未知数

  **能量守恒方程**和**密度状态方程**都是为了求解 $\rho$

  **密度状态方程**将未知数 $\rho$ 转变为 $T$, 再结合**混合物焓守恒方程**求解

  {{< /admonition >}}

* **混合物焓守恒方程**



## 大涡滤波

{{< admonition type=tip title="大涡滤波概念" open=false >}}

大涡模拟(LES)对大尺度湍流运动进行直接计算，

而对于这些运动导致的小于计算网格尺度(滤波尺度)的湍流运动被用模型模拟。

传统湍流建模方法(RANS)和LES之间的主要区别是用于推导运动方程的“平均”方法。

LES不涉及系综平均，而是将空间滤波器应用于N-S方程。

{{< /admonition >}}

通用变量 $\phi (\vec{x},t)$ 为在 $\vec{x}=(x_1,x_2,x_3)$ 处的瞬时流场变量。

经**大涡滤波**过滤后的变量为 $\bar{\phi}(\vec{x},t)$ 。

> $\bar{\phi}(\vec{x},t) = \iiint_{-\infty}^{+\infty}G(\vec{x}-\vec{x'},\Delta) \phi(\vec{x},t)d\vec{x'}$ 

$G(\vec{x}-\vec{x'},\Delta)$ 为与网格尺度 $\Delta=\sqrt[3]{\Delta x_1\Delta x_2\Delta x_3}$ 相关的滤波函数。

---

若对 $\phi (\vec{x},t)$ 进行**Fourier变换**, 得:

> $\hat{\phi} (\vec{x},t)=\iiint_{-\infty}^{+\infty}\phi(\vec{x},t)e^{-i\kappa_ix_i}d\vec{x}$

再对 $\hat{\phi} (\vec{x},t)$ 进行**大涡滤波**, 得：

> $\bar{\hat{\phi}}(\vec{\kappa},t)=\hat{G}(\vec{\kappa},t)*\hat{\phi}(\vec{\kappa},t)$

上式中 $*$ 为卷积符号

由上式可知，滤波函数功能为去除波数(频率)大于某固定值 $\kappa_c$ 的分量( *由Fourier变换得到的* )。

以箱式( *box or top-hat* )滤波为例

$G(\vec{x}-\vec{x'},\Delta)=\begin{cases} \frac{1}{\Delta^3} &\text{if $x_i' \in [x_i-\frac{\Delta}{2},x_i+\frac{\Delta}{2}],\forall i \in 1,2,3$}\\\ 0 &\text{else} \end{cases}$

---

由于滤波带宽 $\Delta$ 可以是空间的函数，空间微分后在滤波与滤波后再空间微分不一致。

$\dfrac{\overline{\partial \phi}}{\partial x_i} \ne \dfrac{\partial \overline{\phi}}{\partial x_i}$    式中不等号两侧的差异为**换向误差(communication error)** 写作$C$。

{{< admonition type=note title="换向误差(communication error)" open=false >}}

对于对称核线性积分算子(埃尔米特核线性积分算子)，换向误差和中心差分误差数量级一致。

`(S. Ghosal and P. Moin. The basic equations for the large eddy simulation of turbulent flows in complex geometry. Journal of Computational Physics, 118:24–37, 1995.)`

虽然中心差分的数值误差主要是**弥散**的，换向误差可以近似为纯**耗散**性质。

`M. Wille. Large Eddy Simulation of a Plane Jet in a Cross Flow. PhD thesis, Imperial College, University of London, London, (UK), 1997.`

相对于由SGS模型产生的湍流动能和标量方差的估计耗散而言，换向误差相关的损耗可以忽略不计

`F. Di Mare. Large Eddy Simulation of reacting and non-reacting turbulent flows in complex geometries. PhD thesis, Imperial College, University of London, London, (UK), 2002.`

{{< /admonition >}}

---

考虑到密度的变化，引入**密度加权滤波算子**, 该算子与未加权的算子性质相同。

因此将**Favre滤波函数**(密度加权滤波函数)定义为：

  $\widetilde{\phi}=\dfrac{\overline{\rho\phi}}{\bar{\rho}}$

滤波后的N-S方程张量形式为：

>  $\dfrac{\partial \bar{\rho}}{\partial t}+\dfrac{\partial \bar{\rho}\tilde{u_i}}{\partial{x_j}}=0\\\ \dfrac{\partial \bar{\rho}\tilde{u_i}}{\partial{t}}+\dfrac{\partial \bar{\rho}\widetilde{u_iu_j}}{\partial x_j}=-\dfrac{\partial \bar{p}}{\partial x_i}+\dfrac{\partial \bar{\sigma_{ij}}}{\partial x_j}$

根据滤波和空间微分算子的可交换性假设，对输运方程中的变量进行来滤波相当于对输运方程滤波。

* 由于分子黏度与温度的关系是非线性的， $\dfrac{\partial \bar{\sigma_{ij}}}{\partial x_j}$ 中也存在未知数，但其影响很小。

  `U. Piomelli. Large-eddy simulation: achievements and challanges. Progress in Aerospace Sciences, 35:335–362, 1999.`

  因此黏性应力张量可表示为：

  $\bar{\sigma_{ij}}=-2\bar{\mu}\widetilde{S_{ij}}+\delta_{ij}\frac{2}{3}\bar{\mu}\widetilde{S_{kk}}$

* $\dfrac{\partial \bar{\rho}\widetilde{u_iu_j}}{\partial x_j}$ 中的 $\bar{\rho}\widetilde{u_iu_j}$ 为未知项，必须封闭。

  通过引入**亚网格应力项**来封闭：

  $\tau_{ij}=\bar{\rho}(\widetilde{u_iu_j}-\widetilde{u_i}\widetilde{u_j})$

  {{< admonition type=note title="Smagorinsky-Lilly模型文献" open=false >}}

  马赫数低时，可忽略SGS应力张量的各向异性部分，忽略各向同性部分

  `M. Y. Erlebacher, G.and Hussaini, C. G. Speziale, and T. A. Zang. Toward the large-eddy simulation of compressible turbulent flows. Journal of Fluid Mechanics, 238:155–185, 1992.`

  Smagorinsky-Lilly模型

  `[1] D. K. Lilly. The representation of small-scale turbulence in numerical simulation rxperiments. In IBM Sci. Comput. Symp. on Environmental Sci. Thomas J. Watson Research Center, Yorktown Heights, NY, 1967.`

  `[2] J. Smagorinsky. General circulation experiments with the primitive equations.I - The basic experiment. Monthly Wheather Review, 91:99–165, 1963.`

  Smagorinsky-Lilly模型动态校准版

  `[1] M. Germano, U. Piomelli, Moin P., and W. H. Cabot. A dynamic sub-grid-scale eddy viscosity model. Physics of Fluids, 23:1760–1765, 1991.`

  `[2] U. Piomelli and J. Liu. Large eddy simulation of rotating channel flows using a localised dynamic model. Physics of Fluids, 7(4):839–848, 1995.`

  {{< /admonition >}}

  **Germano**将**SGS应力参数化**为：

  $\tau_{ij}-\frac{1}{3}\tau_{kk}\delta_{ij}=2\rho C_s\Delta^2||\widetilde{S_{ij}}||_F\widetilde{S_{ij}}$

  其中， $||\widetilde{S_{ij}}||_F$ 为应变率张量的Frobenius模量, 滤波器宽度为单元体积的立方根 $\Delta=\sqrt[3]{\Delta x_1\Delta x_2\Delta x_3}$ 。

  `[1] M. Germano. A proposal for redefinition of the turbulent stresses in the filtered navier-stokes equations. Physics of Fluids, 29(7):2323–2324, 1986.`

  `[2]  M. Germano. Turbulence: the filtering approach. Journal of Fluid Mechanics, 238:325–336, 1992.`

  动态过程基本**尺度相似性假设**为：

  > $C_S(x_i,t)|_\Delta=C_S(x_i,t)|_{\alpha\Delta}=C_S(x_i,t)\\\ \alpha\ge2$

  上式表明模型参数比例是不变的。

  ${\alpha\Delta}$ 为滤波器带宽，其中 $\alpha$ 最佳值为 2，若网格间距一致，$\alpha$ 的值为 3。

  将滤波后的**N-S方程和滤波函数求卷积**，得：

  > $\dfrac{\partial\widehat{\bar{\rho}\tilde{u_i}}}{\partial t}+\dfrac{\partial\widehat{\bar{\rho}\widetilde{u_iu_j}}}{\partial x_j}=-\dfrac{\partial\hat{\bar{p}}}{\partial x_i}+\dfrac{\partial \hat{\bar{\sigma_{ij}}}}{\partial x_j}$

  引入滤波器应力$T_{ij}$表示上式第二项:

    $T_{ij}=\widehat{\bar{\rho}\widetilde{u_iu_j}}=\hat{\bar{\rho}}(\widehat{\widetilde{u_iu_j}}-\hat{\tilde{u_i}} \hat{\tilde{u_j}})$

  $T_{ij}$ 和 $\tau_{ij}$ 都是未知的，但可以通过解析应力张量由**Germano恒等式**联系起来。

    $L_{ij}=T_{ij}-\tau_{ij}=\hat{\bar{\rho}}(\widehat{\tilde{u_i}\tilde{u_j}}-\hat{\tilde{u_i}}\hat{\tilde{u_j}})$

  `M. Germano, U. Piomelli, Moin P., and W. H. Cabot. A dynamic sub-grid-scale eddy viscosity model. Physics of Fluids, 23:1760–1765, 1991.`

  若应用**尺度相似性假设**，$T_{ij}$ 和 $\tau_{ij}$ 为相同的函数形式，因此二者的各向异性分量可以表示为：
  
  $\tau_{ij}-\frac{1}{3}\tau_{kk}\delta_{ij}=-2\bar{\rho}(C_S\Delta)^2||\tilde{S_{ij}}||\tilde{S_{ij}}\\\ T_{ij}-\frac{1}{3}T_{kk}\delta_{ij}=-2\hat{\bar{\rho}}(C_S\Delta)^2||\hat{\tilde{S_{ij}}}||\hat{\tilde{S_{ij}}}$
  
  将上式代入 $L_{ij}$ 式，得：
  
  >  $L_{ij}-\frac{1}{3}L_{kk}\delta_{ij}=-2[\hat{\bar{\rho}}(C_S\alpha\Delta)^2||\hat{\tilde{S_{ij}}}||\hat{\tilde{S_{ij}}}+\widehat{\bar{\rho}(C_S\Delta)^2||\tilde{S_{ij}}||\tilde{S_{ij}}}]$
  
  上式对未知量 $C_S$ 求了卷积，这代表了 5个(由于张量对称且迹为0) 独立的标量 C 的积分方程。Germano假设C不是空间的函数，将上式简化为超定代数方程组：
  
  > $L_{ij}-\frac{1}{3}L_{kk}\delta_{ij}=-2(C_S\Delta)^2M_{ij}$
  >
  > 其中，$M_{ij}=\alpha^2\hat{\bar{\rho}}||\hat{\tilde{S_{ij}}}||\hat{\tilde{S_{ij}}}-\widehat{\bar{\rho}||\tilde{S_{ij}}||\tilde{S_{ij}}}$
  
  {{< admonition type=info title="Germano求解方法" open=false >}}

  将上式与滤波应变张量联系，在未知标量 C 中得到标量方程：
  
  > $(C_S\Delta)^2=-\dfrac{1}{2}\dfrac{L_{ij}^a\widetilde{S_{ij}}}{M_{ij}\widetilde{S_{ij}}}$
  >
  > 其中，$L_{ij}^a$ 的上标 a 表示对于应力的各向异性分量
  
  上式求解得到 $C_S\Delta$ , 以此为亚网格应力项方程$\tau_{ij}=\bar{\rho}(\widetilde{u_iu_j}-\widetilde{u_i}\widetilde{u_j})$ 提供**局部长度尺度**(local length scale)。
  
  上式分母可以变得很小，导致产生计算的不稳定的 C 值。
  
  `M. Germano, U. Piomelli, Moin P., and W. H. Cabot. A dynamic sub-grid-scale eddy viscosity model. Physics of Fluids, 23:1760–1765, 1991`
  
  {{< /admonition >}}
  
  {{< admonition type=info title="Lilly求解方法" open=false >}}
  
  Lilly 提出通过最小化误差，在最小平方意义上求解上式：
  
  > $Q=[L_{ij}-\frac{1}{3}L_{kk}\delta_{ij}+2C_S^*M_{ij}]^2$
  >
  > 其中 $C_S^*=(C_S\Delta)^2=-\dfrac{1}{2}\dfrac{L_{ij}^aM_{ij}}{M_{ij}}$ 
  
  与Germano求解方法不同，Lilly求解方法中分母只有在 $M_{ij}$ 的五个分量全部接近0后才接近0。
  
  如果滤波器应变接近0，两种方法都可以产生一个负的模型参数，从而产生负的涡流黏度，可能使计算不稳定，因此通常将 C 的负值去掉。同样，C 也可能出现错误的过高值，也需要去除。
  
  `D. K. Lilly. A proposed modification of the germano subgrid-scale closure method. Physics of Fluids A, 4:633–635, 1992`
  
  {{< /admonition >}}
  
  Piomelli和Liu提出在
  
   $L_{ij}-\frac{1}{3}L_{kk}\delta_{ij}=-2[\hat{\bar{\rho}}(C_S\alpha\Delta)^2||\hat{\tilde{S_{ij}}}||\hat{\tilde{S_{ij}}}+\widehat{\bar{\rho}(C_S\Delta)^2||\tilde{S_{ij}}||\tilde{S_{ij}}}]$ 
  
  式中使用前一时间步中已知的Smagorinsky参数。
  
  若将其表示为 $C_{S}^*$ ，该式可写为:
  
  >  $L_{ij}-\frac{1}{3}L_{kk}\delta_{ij}=-2[\hat{\bar{\rho}}(C_S\alpha\Delta)^2||\hat{\tilde{S_{ij}}}||\hat{\tilde{S_{ij}}}+\widehat{\bar{\rho}(C_S^*\Delta)^2||\tilde{S_{ij}}||\tilde{S_{ij}}}$
  
  当前时间步参数为：
  
  >  $(C_S\Delta)^2=-\dfrac{1}{2\alpha^2}\dfrac{\widehat{[L_{ij}^a-\bar{\rho}(C_S^*\Delta)^2||\tilde{S_{ij}}||\tilde{S_{ij}}}]M_{ij}}{M_{kl}M_{kl}}$
  
  `U. Piomelli and J. Liu. Large eddy simulation of rotating channel flows using a localised dynamic model. Physics of Fluids, 7(4):839–848, 1995.`


