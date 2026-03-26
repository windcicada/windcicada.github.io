# funcv ch4 arm2

# funcv_ch4_arm2.F90

## 功能概述
**19 物种甲烷 (CH₄) 燃烧 + NO 排放化学动力学机理**。基于 GRI3.0 详细机理简化的 15 步机理，包含 NO 生成路径。

## 参考文献
C.J. Sung, C.K. Law, and J.-Y. Chen, "Augmented Reduced Mechanisms for NO Emission in Methane Oxidation", Combustion & Flame 125:906-919 (2001).

## 子程序接口
```fortran
subroutine funcv_ch4_arm2(kk, Y, WDOT, rho, T, press, iopt)
```

## 机理概要
- **物种数**：19 种
- **反应步数**：15 步

## 物种清单
H₂, H, O₂, OH, H₂O, HO₂, H₂O₂, CH₃, CH₄, CO, CO₂, CH₂O, C₂H₂, C₂H₄, C₂H₆, NH₃, NO, HCN, N₂

## 关键反应（15 步）

**CH₄ 氧化**：
1. `2H + 2OH = 2H₂ + O₂`
2. `H + CH₄ = H₂ + CH₃`
3. `OH + CH₃ = H₂ + CH₂O`
4. `CH₂O = H₂ + CO`

**C₂ 路径**：
5. `O₂ + C₂H₂ = H₂ + 2CO`
6. `OH + C₂H₄ = H₂ + CH₃ + CO`
7. `C₂H₆ = H₂ + C₂H₄`

**NO 生成**：
8. `2NO = O₂ + N₂`
9. `H₂ + CO + NO = H + O₂ + HCN`
10. `3H + H₂O + NH₃ = 4H₂ + NO`

## 特点
- 包含 Thermal NO 和 Prompt NO 路径
- 适用于富燃/贫燃甲烷火焰

