# chemdot

# chemdot.F90 - Chemical Source Term Wrapper

## 概述

`chemdot` 是一个简单的包装子程序，用于调用化学反应速率计算。

## 调用关系

- **调用者**: 化学求解器
- **调用**: `ydot` (在 `chemsol.F90` 中定义)

## 参数

| 参数 | 说明 |
|------|------|
| `nsp` | 物种数量 |
| `t` | 时间 (s) |
| `y(nsp)` | 物种摩尔数 (kmol/kg) |
| `wdot(nsp)` | 反应生成率 (kmol/(m³·s)) |

## 用途

在化学求解器中作为统一的接口调用反应机理。

