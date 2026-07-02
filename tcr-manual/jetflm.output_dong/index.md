# Jetflm.output dong

# Jetflm.output_dong.F90 - 探针输出程序

## 功能概述

自定义探针输出程序，用于在特定轴向位置（按喷嘴直径无量纲化 x/d）输出温度和物种的径向分布数据。

## 主要用途

- 后处理喷嘴火焰实验数据
- 提取特定 x/d 位置的径向剖面
- 输出 CSV 格式便于其他软件读取

## 关键参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `ra_x` | 1, 2, 3, 7.5, 15, 30, 45, 60, 75 | 输出位置 (x/d) |
| `delta_x` | 0.0005 | 位置容差 |
| `diam_jet` | 0.0072 m | 喷嘴直径 |
| `c_curr` | 0.96 | 缩放因子 |

## 输出变量

### 温度
- `T_{xdname}.csv` - 平均温度
- `Trms_{xdname}.csv` - 温度 RMS

### 物种（8种）
O₂, H₂, H₂O, N₂, CH₄, CO, CO₂, OH

每个物种输出：
- `{species}_{xdname}.csv` - 平均质量分数
- `{species}rms_{xdname}.csv` - RMS 脉动

## 数据格式

CSV 文件，每行：`r/d, value`

- `r/d` - 径向距离（无量纲）
- `value` - 对应的平均值或 RMS

## 输出位置

`Probes/` 目录下，按域分别输出：
```
Probes/T_010.000.csv   # T_mean at x/d = 1
Probes/Trms_010.000.csv # T_RMS at x/d = 1
Probes/O2_010.000.csv   # O2 mean at x/d = 1
...
```

## 注意事项

1. 物种索引通过 `names(isp)` 匹配获取
2. RMS 计算使用：$\sqrt{\max(Y'² - \bar{Y}², 0)}$
3. 径向坐标：`r/d = sqrt(y² + z²) / diam_jet`

