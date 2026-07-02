# 湍流燃烧大涡模拟：数值方法


> **写在前面**：本文详细介绍 LES-TPDF 湍流燃烧求解器的数值实现方法，包括坐标变换、方程离散化、压力-速度耦合求解等核心算法。作为理论博客（《LES-TPDF 概率密度函数方法详解》）的后续实践篇。

---

## 1. 坐标变换

### 1.1 从物理空间到计算空间

对于复杂几何外形的流场，采用 Thompson 提出的坐标变换方法，将物理空间 $(x_1, x_2, x_3)$ 映射到矩形计算空间 $(\xi_1, \xi_2, \xi_3)$。这一变换的核心优势在于：无论物理边界如何复杂，计算空间中均可采用标准的矩形网格离散格式。

**Jacobian 矩阵**定义为：

$$J_{ij} = \frac{\partial x_i}{\partial \xi_j}$$

其行列式 $|J|$ 满足：

$$|J| = \frac{\partial x_i}{\partial \xi_j} A_{ij}, \quad \text{（不对 $i$ 求和）}$$

其中 $A_{ij}$ 是余因子矩阵的元素，定义为 $\mathbf{A} = |J| \cdot |J|^{-1}$。

### 1.2 变换后的导数

利用链式法则，物理空间中的导数可表示为：

$$\frac{\partial \phi}{\partial x_i} = \frac{A_{ij}}{|J|} \frac{\partial \phi}{\partial \xi_j}$$

### 1.3 变换后的输运方程

变换后的控制方程（以 Favre 过滤量为例）：

**连续方程**：

$$\frac{\partial \overline{\rho}}{\partial t} + \frac{\partial}{\partial \xi_k} \left( \frac{A_{ki}}{|J|} \overline{\rho} \widetilde{u}_i \right) = 0$$

**动量方程**：

$$\frac{\partial \overline{\rho} \widetilde{u}_i}{\partial t} + \frac{\partial}{\partial \xi_k} \left( \frac{A_{kj}}{|J|} \overline{\rho} \widetilde{u}_i \widetilde{u}_j \right) = -\frac{A_{ki}}{|J|} \frac{\partial \overline{p}}{\partial \xi_k} + \frac{\partial}{\partial \xi_k} \left( \frac{A_{kj}}{|J|} \Gamma_{eff} \frac{\partial \widetilde{u}_i}{\partial \xi_l} \right)$$

**守恒标量方程**：

$$\frac{\partial \overline{\rho} \widetilde{\phi}}{\partial t} + \frac{\partial}{\partial \xi_k} \left( \frac{A_{ki}}{|J|} \overline{\rho} \widetilde{u}_i \widetilde{\phi} \right) = \frac{\partial}{\partial \xi_k} \left( \frac{A_{ki}}{|J|} \Gamma_{eff} \frac{\partial \widetilde{\phi}}{\partial \xi_l} \right)$$

其中 $\Gamma_{eff}$ 为有效扩散系数（分子扩散 + 湍流扩散）。

> **伪压力**：对于低马赫数不可压缩流动，通常将应变张量迹和湍动能的贡献加入热力学压力，形成伪压力 $p = p_{ther} + \frac{2}{3} \mu_t \left( \frac{A_{ml}}{|J|} \frac{\partial u_m}{\partial \xi_l} + k \right)$

---

## 2. 输运方程的离散化

### 2.1 控制体积法

采用**控制体积法**（有限体积法）进行空间离散。该方法的核心优势在于自动满足**守恒性**——离散格式与原始偏微分方程满足相同的守恒定律。

网格布局采用**同位存储**（Colocated Arrangement）：所有原始变量（速度、压力、标量）均存储在单元中心，假设在控制体积内均匀分布。相邻节点间采用线性插值确定单元面上的值。

### 2.2 对流项离散

以 $u$-动量方程为例，对流项的离散形式为：

$$\int_{\partial S} G_k \widetilde{u}_i n_k dS \approx G_1 \widetilde{u}\,_{n} - G_1 \widetilde{u}\,_{s} + G_2 \widetilde{u}\,_{e} - G_2 \widetilde{u}\,_{w} + G_3 \widetilde{u}\,_{r} - G_3 \widetilde{u}\,_{l}$$

其中 $G_k = A_{ik} \overline{\rho} \widetilde{u}_i$ 为质量通量，$n, s, e, w, r, l$ 表示六个单元面。

### 2.3 扩散项离散

扩散项采用类似的中心差分格式。以北界面为例：

$$\mu_t \frac{A_{11}}{|J|} \frac{\partial \widetilde{u}}{\partial \xi_1} \_{n} \approx \frac{\mu_{t,P} + \mu_{t,N}}{2} (\widetilde{u}_N - \widetilde{u}_P) \frac{A_{11}}{|J|}$$

由网格非正交性引起的交叉导数项作为源项显式处理。

### 2.4 时间离散

时间项采用**三点向后格式**（Three-Point Backward Scheme）：

$$\overline{\rho} \frac{\partial \widetilde{\phi}}{\partial t} \approx \rho^* \left[ (R+1) \frac{\phi^{n+1} - \phi^n}{\delta t} - R \frac{\phi^n - \phi^{n-1}}{\delta t_o} \right]$$

其中 $R = \frac{\delta t}{\delta t + \delta t_o}$，$\rho^* = \frac{\rho^{n+1} + \rho^n}{2}$。

若采用恒定时间步长，上式退化为经典格式：

$$\overline{\rho} \frac{\partial \widetilde{\phi}}{\partial t} \approx \rho^* \left[ \frac{3}{2} \frac{\phi^{n+1} - \phi^n}{\delta t} - \frac{1}{2} \frac{\phi^n - \phi^{n-1}}{\delta t} \right]$$

### 2.5 代数方程

离散后得到准线性代数方程：

$$\widetilde{\phi}_P a_P = \sum_{S,N,W,E,L,R} \widetilde{\phi}_\alpha a_\alpha + S_P$$

其中 $S_P$ 为包含所有无法表示为面通量的源项。

---

## 3. 标量输运方程的 TVD 格式

### 3.1 Godunov 定理与 TVD 原则

中心差分格式在求解标量输运方程时会产生负值的非物理振荡。**Godunov 定理**指出：线性二阶格式（中心或迎风）无法同时满足二阶精度和单调性——即必然产生振荡。

为克服这一问题，引入**总变差递减**（TVD）原则。标量守恒律的总变差定义为：

$$\mathrm{TV}(\phi) = \sum_i |\phi_{i+1} - \phi_i|$$

TVD 格式满足 $\text{TV}(\phi^{n+1}) \le \text{TV}(\phi^n)$，确保不产生新的极值。

### 3.2 通量限制器

高阶格式可通过低阶通量和高阶通量的线性组合构造：

$$h_n = h_n^\ell + \Psi_n (h_n^h - h_n^\ell)$$

其中 $\Psi_n$ 为**通量限制器**（Flux Limiter），依赖于解的光滑度，通过相邻梯度比 $r_P$ 度量：

$$r_P = \frac{\delta^- \phi_P}{\delta^+ \phi_P}$$

$$\delta^- \phi_P = \phi_P - \phi_S, \quad \delta^+ \phi_P = \phi_N - \phi_P$$

### 3.3 van Leer 格式

本程序采用 van Leer 提出的通量限制器：

$$\Psi(r) = \frac{r + |r|}{1 + |r|}$$

或等效形式：

$$\Psi(r) = \begin{cases} 0 & r \le 0 \\ \frac{2r}{1+r} & r > 0 \end{cases}$$

单元面上的通量计算：

$$\phi_n = \begin{cases} \widetilde{\phi}_P + \frac{\Psi(r^+)}{2} (\widetilde{\phi}_N - \widetilde{\phi}_P) & G_{1,n} \ge 0 \\ \widetilde{\phi}_N + \frac{\Psi(r^-)}{2} (\widetilde{\phi}_N - \widetilde{\phi}_P) & G_{1,n} < 0 \end{cases}$$

在光滑区域 ($r \approx 1$)，$\Psi \approx 1$，格式保持二阶精度；在极值点处退化为一阶精度，确保 TVD 性质。

---

## 4. 压力-速度耦合求解

### 4.1 SIMPLE 型算法

压力和速度场通过 **SIMPLE**（Semi-Implicit Method for Pressure-Linked Equations）型算法求解。以 $u$-动量方程为例，离散形式可写为：

$$\mathbf{u}^{n+1} - \frac{4}{3}\mathbf{u}^n + \frac{1}{3}\mathbf{u}^{n-1} + \frac{2}{3}\delta t \mathbf{T} \mathbf{u}^{n+1} = -\frac{2}{3}\delta t \mathbf{D} \mathbf{p}^{n+1} + \frac{2}{3}\delta t \mathbf{S}$$

### 4.2 两级近似分解

为保持二阶精度，采用**两级近似分解**（Two-Stage Approximate Factorisation）。

**第一级**：

$$\mathbf{u}^* = (\mathbf{I} + \frac{2}{3}\delta t \mathbf{T}\,_{n})^{-1} \cdot \frac{2}{3}\delta t (\mathbf{D}\mathbf{p}^n + \mathbf{S}\,_{n})$$

$$\mathbf{u}^m = \mathbf{u}^* - \frac{2}{3}\delta t \mathbf{D} (\boldsymbol{\Delta}\mathbf{p})^m$$

**第二级**：

$$\mathbf{u}^{**} = (\mathbf{I} + \frac{2}{3}\delta t \mathbf{T}\,_{m})^{-1} \cdot \frac{2}{3}\delta t (\mathbf{D}\mathbf{p}^m + \mathbf{S}\,_{m})$$

$$\mathbf{u}^{n+1} = \mathbf{u}^{**} - \frac{2}{3}\delta t \mathbf{D} (\boldsymbol{\Delta}\mathbf{p})^{n+1}$$

其中 $(\boldsymbol{\Delta}\mathbf{p})^m = \mathbf{p}^m - \mathbf{p}^{m-1}$ 为压力增量。

### 4.3 压力修正方程（Poisson 方程）

将速度表达式代入连续方程，得到压力增量的 **Poisson 型方程**：

$$A_{1i}\rho u_i\big|_{n} - A_{1i}\rho u_i\big|_{s} = A_{1i}\frac{\delta t}{R+1} \left( \frac{A_{ki}}{|J|} \frac{\partial \Delta p^m}{\partial \xi_k} \right)_{n} - A_{1i}\frac{\delta t}{R+1} \left( \frac{A_{ki}}{|J|} \frac{\partial \Delta p^m}{\partial \xi_k} \right)_{s}$$

### 4.4 Rhie-Chow 压力平滑

同位存储格式下，压力场与速度场可能产生棋盘格式的振荡。**Rhie-Chow 压力平滑**通过在压力修正方程中添加三阶导数项来消除这一耦合问题：

$$A_{1i}u_i\big|_{n} - A_{1i}u_i\big|_{s} + A_{1i}\frac{\delta t}{R+1} \left( \frac{A_{ki}}{|J|} \frac{\partial^3 p^{m-1}}{\partial \xi_k^3} \right)_{n} - A_{1i}\frac{\delta t}{R+1} \left( \frac{A_{ki}}{|J|} \frac{\partial^3 p^{m-1}}{\partial \xi_k^3} \right)_{s} = \mathrm{RHS}$$

该格式采用 $1\Delta$ 紧凑模板计算压力梯度，确保压力场与质量通量的强耦合。

### 4.5 求解算法流程

1. 由 $n$ 时刻流场 ($\mathbf{u}^n, \mathbf{v}^n, \mathbf{w}^n, \mathbf{p}^n, \rho^n$)，求解 $\mathbf{u}^*, \mathbf{v}^*, \mathbf{w}^*$
2. 求解压力增量 Poisson 方程 $(\boldsymbol{\Delta}\mathbf{p})^m$
3. 更新速度得 $\mathbf{u}^m, \mathbf{v}^m, \mathbf{w}^m$，更新压力 $p^m$ 和质量通量 $G_k^m$
4. 求解标量场 $\phi^m$
5. 由 $m$ 时刻流场，求解 $\mathbf{u}^{**}, \mathbf{v}^{**}, \mathbf{w}^{**}$
6. 求解压力增量 Poisson 方程 $(\boldsymbol{\Delta}\mathbf{p})^{n+1}$
7. 更新速度得 $\mathbf{u}^{n+1}, \mathbf{v}^{n+1}, \mathbf{w}^{n+1}$，更新压力 $p^{n+1}$ 和质量通量 $G_k^{n+1}$
8. 求解标量场 $\phi^{n+1}$
9. 由 $\phi^{n+1}$ 更新密度、粘性和组分

### 4.6 求解器选择

- **动量方程与标量方程**：采用 Van der Vorst 提出的 **Bi-CGSTAB**（双共轭梯度稳定性）方法
- **压力 Poisson 方程**：采用 **ICCG(1,1,1)**（不完全 Cholesky 预处理的共轭梯度法）

其中压力增量的梯度项为：

$$\frac{A_{ki}}{|J|}\frac{\partial \Delta p^m}{\partial \xi_k} = \frac{A_{1i}}{|J|}\frac{\partial \Delta p^m}{\partial \xi_1} + \frac{A_{2i}}{|J|}\frac{\partial \Delta p^m}{\partial \xi_2} + \frac{A_{3i}}{|J|}\frac{\partial \Delta p^m}{\partial \xi_3}$$

采用紧凑 $1\Delta$ 模板近似：

$$\frac{\partial \Delta p^m}{\partial \xi_1}\_{n} = \Delta p_N^m - \Delta p_P^m$$

质量通量在单元面的更新公式为：

$$G_1^m\,_{n} = G_1^*\,_{m-1} - A_{1i}\frac{A_{1i}}{|J|}\,_{n} \frac{\delta t}{R+1} ((\Delta p)^m_N - (\Delta p)^m_P)$$

速度在单元中心的更新公式为：

$$u_{i,P} = A_{ik,P}\left[ A_{ki}u^{m-1}_{i,P} - \frac{1}{\rho}\frac{A_{ki}^2}{|J|}\frac{\delta t}{R+1} \frac{\partial (\Delta p)^m}{\partial \xi_k} \right]_P$$

标量对流项的离散形式为：

$$\int_{\partial S} G_k \widetilde{\phi} n_k dS \approx G_1 \phi\,_{n} - G_1 \phi\,_{s}$$

残差归一化采用无穷范数：

$$\lVert \mathbf{u}^{n+1} \rVert^{\\#} = \frac{1}{t^{\\#}} \left[ \max\left( \rho_{ijk}^2 u_{ijk}^2 + \rho_{ijk}^2 v_{ijk}^2 + \rho_{ijk}^2 w_{ijk}^2 \right)^{1/2} \right]$$

标量场的归一化残差为：

$$\lVert \mathbf{\phi}^{n+1} \rVert = \frac{1}{t^{\\#}} \left[ \max\left( \rho_{ijk}^2 \phi_{ijk}^2 \right)^{1/2} \right]$$

压力 Poisson 方程残差的归一化：

$$\lVert \mathbf{\Delta P}^{n+1} \rVert^{\\#} = \frac{1}{t^{\\#}} \left( \frac{1}{N}\sum_N \rho_{ijk}^2 \right)^{1/2}$$

---

## 5. 总结

本文详细介绍了 LES-TPDF 湍流燃烧求解器的数值实现方法：

1. **坐标变换**：通过 Jacobian 矩阵实现物理空间到计算空间的映射，简化复杂边界处理
2. **空间离散**：控制体积法自动满足守恒性，对流项采用 van Leer TVD 格式防止非物理振荡
3. **时间离散**：三点向后格式保证二阶精度，灵活的时间步长适应燃烧初期的大密度变化
4. **压力-速度耦合**：SIMPLE 型算法结合两级近似分解确保二阶时间精度，Rhie-Chow 光滑消除同位存储的棋盘格振荡

这些数值方法共同构成了一个稳定、高效、可信的 LES-TPDF 湍流燃烧求解器框架。

---

## 参考文献

1. Thompson, J.F. (1974). Grid Generation. *Numerical Grid Generation*.
2. Patankar, S.V. (1971). Calculation of Unsteady Three-Dimensional Flows. *Int. J. Heat Mass Transfer*.
3. Rhie, C.M., Chow, W.L. (1983). A Numerical Study of the Turbulent Flow Past an Airfoil. *AIAA Journal*.
4. Van der Vorst, H.A. (1992). Bi-CGSTAB: A Fast and Smoothly Converging Variant of Bi-CG for the Solution of Nonsymmetric Linear Systems. *SIAM J. Sci. Stat. Comput.*
5. Hirsch, C. (1990). *Numerical Computation of Internal and External Flows*. Wiley.

