# react psr

# react_psr.F90

## 功能概述
**PSR（Perfectly Stirred Reactor）反应器子程序**。计算给定条件下的化学平衡/反应结果。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `reactor_psr` | PSR 反应器求解 |

## 算法描述

### 1. 输入条件
- 密度 `den`
- 压力 `pressr` 或 `pressure`
- 物种摩尔分数 `theta` 或质量分数 `yn`
- 温度 `field_temperature`
- 密度 `field_density`

### 2. 反应计算
```fortran
call chemistry(...)  ! 调用化学求解器
call temperature(...)  ! 更新温度
```

### 3. 输出
- `hdot_fg`：释热率
- `field_hdot`：场释热率
- 更新物种场和温度场

## 依赖模块
- `arrays`：jo, ko, nfo, f, p
- `chemistry`：den, pressr, pressure, theta, yn, yold, isp, nsp, nsc
- `exchange`：MPI 通信
- `global`：全局参数
- `sgs_pdf`：PDF 参数

## 用途
TCR 模型中使用 PSR 作为参考反应器计算混合时间尺度。

