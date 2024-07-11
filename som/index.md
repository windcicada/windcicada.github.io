# 二阶矩模型


## 综述

在大涡模拟（LES）中，二阶矩（Second-order Moment，SOM）模型直接分析滤波后的阿伦尼乌斯形式反应速率表达式，保留其至二阶项而忽略高阶项。

早期的二阶矩模型对化学反应源项的阿伦尼乌斯表达式进行泰勒展开，并假设$\frac{E}{RT}$为小量且$\frac{T'}{T}<<1$，基于此方法得到的时均反应率$w$为：

$$\bar{w_s}=B{\rho}^2\bar{Y_1}\bar{Y_2}exp(-\frac{E}{R\bar{T}})[1+\frac{\overline{(Y'_1Y'_2)}}{\bar{Y_1}\bar{Y_2}}+\frac{E}{R\bar{T}}(\frac{\overline{(T'Y'_1)}}{\bar{T}\bar{Y_1}}+\frac{\overline{(T'Y'_2)}}{\bar{T}\bar{Y_2}})+frac{1}{2}(\frac{E}{R\bar{T}})^2\overline{(\frac{T'}{\bar{T}})^2}]=B{\rho}^2\bar{Y_1}\bar{Y_2}exp(-\frac{E}{R\bar{T}})[1+F]$$

基于以上两个假设，时均反应速率的封闭问题被转换为温度、浓度之间的二阶矩的封闭问题。可建立这些二阶矩的输运方程并应用梯度模拟使这些方程封闭。因此在SOM模型中需要引入多个二阶标量脉动关联矩的微分方程（称其为二阶矩输运方程）。对于强剪切流动，可忽略二阶标量脉动关联矩输运方程中的对流项和扩散项，并认为化学反应源项对脉动关联矩的影响是次要的，从而得到二阶标量脉动关联矩的代数表达式。

实际情况中$\frac{E}{RT}$在一些燃烧反应中达到5~10，特别是对于污染物生成相关慢速反应，且可能不满足$\frac{T'}{T}<<1$，因此这种展开方式可能低估时均反应源项的贡献，存在较大误差[1]。为弥补这些不足，周力行[2]考虑湍流脉动对化学反应速率的影响，提出统一二阶矩（Unified Second-order Moment，USM）模型，该模型将指数项纳入反应速率系数项中，并增加了与温度脉动相关的反应速率系数脉动、以及与组分质量分数脉动之间的相关的修正项，并使用对应量的输运方程求解。



```参考文献
[1] Khalil E E. On the prediction of reaction rates in turbulent premixed confined flames[C]. 18th Aerospace Sciences Meeting, 1980.
[2] Zhou L X, Qiao L, Zhang J. A unified second-order moment turbulence-chemistry model for simulating turbulent combustion and NOx formation[J]. Fuel, 2002, 81:1703~1709.
```


