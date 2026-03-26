# funcv ch4 red19

# funcv_ch4_red19.F90

## 功能概述
**19 物种甲烷 (CH₄) 简化机理**。基于 GRI3.0 的 15 步简化机理，由 Lu & Law 开发，使用计算奇异摄动 (CSP) 方法识别准稳态物种。

## 参考文献
Tianfeng Lu and Chung K. Law, "A criterion based on computational singular perturbation for the identification of quasi steady state species: A reduced mechanism for methane oxidation with NO chemistry", Combustion and Flame, Vol.154 No.4 pp.761-774, 2008.

## 子程序接口
```fortran
subroutine funcv_ch4_red19(P, T, Y, WDOT, iopt)
```

## 机理概要
- **物种数**：19 种
- **反应步数**：15 步

## 关键反应
1. `2O = O₂`
2. `H + O = OH`
3. `O + CH₃ = H + CH₂O`
4. `O + CO = CO₂`
5. `H + O₂ = HO₂`
6. `2H = H₂`
7. `H + OH = H₂O`
8. `H + CH₃ = CH₄`
9. `H + CH₂CO = CH₃ + CO`
10. `H₂ + CO = CH₂O`
11. `2OH = H₂O₂`
12. `OH + CH₃ = CH₃OH`
13. `2CH₃ = C₂H₆`
14. `C₂H₄ = H₂ + C₂H₂`
15. `O + C₂H₂ = CH₂CO`

## 内部调用
- `YTCP`：浓度计算
- `RATT1`：速率常数
- `RATX1`：净反应速率
- `QSSA1`：准稳态近似
- `RDOT1`：生成速率

