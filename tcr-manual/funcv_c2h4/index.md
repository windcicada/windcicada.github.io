# funcv c2h4

# funcv_c2h4.F90

## 功能概述
**22 物种乙烯 (C₂H₄) 燃烧化学动力学机理**。基于 GRI3.0 详细机理简化，用于计算各物种的化学源项。

## 参考文献
Z. Luo, C.S. Yoo, E.S. Richardson, J.H. Chen, C.K. Law, T.F. Lu, "Chemical explosive mode analysis for a turbulent lifted ethylene jet flame in highly-heated coflow", Combustion and Flame, 2011.

## 物种清单 (22 种)
| 序号 | 物种 | 序号 | 物种 |
|------|------|------|------|
| 1 | H₂ | 12 | CO₂ |
| 2 | H | 13 | CH₂O |
| 3 | O | 14 | C₂H₂ |
| 4 | O₂ | 15 | C₂H₄ |
| 5 | OH | 16 | C₂H₆ |
| 6 | H₂O | 17 | HCCO |
| 7 | HO₂ | 18 | CH₂CO |
| 8 | H₂O₂ | 19 | CH₃CHO |
| 9 | CH₃ | 20 | C₃H₅ |
| 10 | CH₄ | 21 | C₃H₆ |
| 11 | CO | 22 | N₂ |

## 子程序接口
```fortran
subroutine funcv_c2h4(rho, T, Y, WDOT, iopt)
```
- **输入**：密度 rho、温度 T、质量分数 Y(22)
- **输出**：摩尔生成速率 WDOT(22)
- **iopt**：选项标志

## 内部变量
- `rf(206)`：正向反应速率常数
- `rb(206)`：逆向反应速率常数
- `rklow(21)`：低压极限速率
- `c(22)`：摩尔浓度

## 依赖模块
- `chemistry`：分子量 wm

