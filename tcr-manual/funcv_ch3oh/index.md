# funcv ch3oh

# funcv_ch3oh.F90

## 功能概述
**18 物种甲醇 (CH₃OH) 燃烧化学动力学机理**。由 CARM 自动生成，包含 14 步反应、18 种物种。

## 子程序接口
```fortran
subroutine funcv_ch3oh(P, T, Y, WDOT, iopt)
```

## 机理概要
- **物种数**：18 种
- **稳态物种**：14 种
- **反应步数**：14 步

## 物种清单 (部分)
| 序号 | 物种 | 序号 | 物种 |
|------|------|------|------|
| 1 | H | 10 | CH₂O |
| 2 | O | 11 | CH₄ |
| 3 | OH | 12 | CH₃ |
| 4 | O₂ | 13 | C₂H₂ |
| 5 | H₂ | 14 | C₂H₄ |
| 6 | H₂O | 15 | C₂H₆ |
| 7 | HO₂ | 16 | CH₃OH |
| 8 | CO | 17 | N₂ |
| 9 | CO₂ | 18 | (备用) |

## 关键反应
1. `H + O₂ = O + OH`
2. `OH + CO = H + CO₂`
3. `2CH₃ = C₂H₆`
4. `OH + CH₃ = CH₃OH`
5. `O₂ + CH₃OH = CH₂O + H₂O₂`

## 依赖模块
- 由 CARM (Chemistry Automatic Reduction Method) 自动生成

