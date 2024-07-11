# SIMPLE流场计算算法

# 压力耦合方程的半隐式方法

## 基本思想

1. 对于给定的压力场（可以是假定值或是上一次迭代计算所得到的结果），求解 **离散形式的动量方程** ，得到速度场。（因为压力场是假定的，可能是不精确的，得到的速度场一般不满足连续方程）
2. 根据**离散形式的连续方程**所规定的速度与压力的关系得到**压力修正方程**，由压力修正方程得到压力修正值。
3. 根据修正后的压力场求解得到新的速度场。
4. 检查速度场是否收敛，若不收敛，则以现压力场为基础继续修正。



## 离散形式动量方程

$\vec{u}^{n+1}-\frac{4}{3}\vec{u}^n+\frac{1}{3}\vec{u}^{n-1}+\frac{2}{3}\delta t\cdot \vec{T}\cdot \vec{u}=-\frac{2}{3}\delta t\cdot \vec{D}\cdot\vec{p}^{n+1}+\frac{2}{3}\delta t \cdot \vec{S}+\Omicron(\Delta t^3)$

* $\vec{T}$ : 对流项和扩散项 (convective and diffusive coef.)
* $\vec{D}$ : 压力梯度相关项 (pressure grad.)
* $\vec{S}$ : 已知项，包括交叉导数项 ( coef. known, including cross derivatives)

为保持二阶精度，上式由两段近似因子分解求解。

$\vec{u}^{n+1}-\frac{4}{3}\vec{u}^n+\frac{1}{3}\vec{u}^{n-1}+\frac{2}{3}\delta t\cdot \vec{T}\cdot \vec{u}=-\frac{2}{3}\delta t\cdot \vec{D}\cdot\vec{\Delta p}^{m}-\frac{2}{3}\delta t\cdot\delta t\cdot \vec{D}\cdot\vec{p}^{n}+\frac{2}{3}\delta t \cdot \vec{S}+\Omicron(\Delta t^3)$

其中上标 $m\isin(n,n+1)$，为相邻两个时间步中间的某时间，

### 1. 第一阶段

在求解过程的第一阶段应用近似因子分解，

$(\vec{I}+\frac{2}{3}\delta t\cdot \vec{T}|_n)\underbrace{(\vec{u}^m+\frac{2}{3}\delta t \cdot\vec{D}\cdot\vec{\Delta p}^{m})}_{u^*}=-\frac{2}{3}\delta t\cdot \vec{D}\cdot\vec{p}^{n}+\frac{2}{3}\delta t \cdot \vec{S}|_n+\Omicron(\Delta t^3)$

上式中，$\vec{u}^n$ 被合并到 $\vec{S}$ 中，在时间 $m$ 处求解，

上式被分为两步求解，

$\vec{u}^*=(\vec{I}+\frac{2}{3}\delta t\cdot \vec{T}|_n)^{-1}\cdot\frac{2}{3}\delta t\cdot (\vec{D}\cdot\vec{p}^n+\vec{S}|_n)$

$\vec{u}^m=\vec{u}^*-\frac{2}{3}\delta t \vec{D}\cdot \vec{\Delta p}^m$

上式中，$\vec{u}^m$ 为假定速度，不一定满足连续方程，具有一阶精度。  $\vec{\Delta p}^m$ 为未知量，需要结合连续方程求解。

### 2.第二阶段

在下一时间步($n+1$)处应用近似因子分解，

$(\vec{I}+\frac{2}{3}\delta t\cdot \vec{T}|_m)\underbrace{(\vec{u}^{n+1}+\frac{2}{3}\delta t \cdot\vec{D}\cdot\vec{\Delta p}^{n+1})}_{u^{**}}=-\frac{2}{3}\delta t\cdot \vec{D}\cdot\vec{p}^{m}+\frac{2}{3}\delta t \cdot \vec{S}|_m+\Omicron(\Delta t^3)$

同样的，将上式分为两步分解，

$\vec{u}^{**}=(\vec{I}+\frac{2}{3}\delta t\cdot \vec{T}|_m)^{-1}\cdot\frac{2}{3}\delta t\cdot (\vec{D}\cdot\vec{p}^m+\vec{S}|_m)$

$\vec{u}^{n+1}=\vec{u}^{**}-\frac{2}{3}\delta t \vec{D}\cdot \vec{\Delta p}^{n+1}$

由于$\vec{u}^m$一阶近似于$\vec{u}^{n+1}$，因此求解方法达到二阶精度。

### 3.压力梯度求解

$A_{1i}\rho_i^*|_N-A_{1i}\rho_i^*|_S=A_{1i}\frac{\delta t}{R+1}(\frac{A_{ki}}{|J|}\frac{\partial \Delta p^m}{\partial \xi_k})|_N-A_{1i}\frac{\delta t}{R+1}(\frac{A_{ki}}{|J|}\frac{\partial \Delta p^m}{\partial \xi_k})|_S$

$\frac{\partial \Delta p^m}{\partial \xi_1}|_n=\frac{1}{2}(\frac{(\Delta p)^m_N-(\Delta p)^m_S}{2}+\frac{(\Delta p)^m_{NN}-(\Delta p)^m_P}{2})$

~~未完待续~~




