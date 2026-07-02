# funcv c7h16

# funcv_c7h16.F90

## 功能概述
**44 物种正庚烷 (n-Heptane, C₇H₁₆) 燃烧化学动力学机理**。基于 Liu, S., Hewson, J. C., Chen, J. H., Pitsch, H. 的 18 步简化机理。

## 参考文献
Liu, S., Hewson, J. C., Chen, J. H., Pitsch, H., "Effect of strain rate on high-pressure nonpremixed n-heptane autoignition in counterflow", Combust. Flame, 137, pp. 320-339, 2004.

## 子程序接口
```fortran
subroutine funcv_c7h16(kk, Y, WDOT, rho, T, press, iopt)
```
- **输入**：物种数 KK、质量分数 Y、密度 rho、温度 T、压力 press
- **输出**：物种生成速率 WDOT

## 内部调用链
1. **浓度计算**：C(I) = Y(I) * rho（从质量分数转为浓度）
2. **RRATES**：计算反应速率
   - 计算速率系数 K(185)
   - 计算三体浓度 M
   - 稳态近似处理
3. **结果归一化**：WDOT = WDOT / rho

## 变量维度
- `NTOTALSP = 44`：总物种数
- `WR(185)`：反应速率
- `K(185)`：速率系数
- `C(44)`：浓度
- `COEF(2,7,KK)`：系数矩阵

## 燃料
正庚烷 (n-Heptane, C₇H₁₆)：常用的柴油替代燃料

