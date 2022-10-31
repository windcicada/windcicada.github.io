# 浸没边界方法文献综述


# 浸没边界方法

## 用途

* 模拟存在复杂结构的流场
* 模拟动边界问题

## 基本思想

将复杂结构的边界模化为N-S方程中的一种彻体力，用**笛卡尔网格**解决网格生成困难问题并提高计算效率。

`Peskin C S. Flow patterns around heart valves: a numerical method ［J］．J Comput Phys, 1972.2：2252－271．`

N-S方程: $\dfrac{\partial (\rho u_i)}{\partial t}+\nabla\cdot(\rho u_i\vec{u})=\nabla\cdot(\mu\nabla\vec{u})+(-\dfrac{\partial p}{\partial x_i}+S_{u_i})$

令 $F=S_{u_i}$ ，代表单位体积收受到的彻体力。

### 离散边界和流体的链接

用函数 $D_{ij}(\vec{x_k}),\vec{x_k}\in Boundary$ 链接边界和流体的两种方式：

* 通过评估浸没边界给定点的速度场
* 通过**将边界力分散到附近的流体域网格点上**




