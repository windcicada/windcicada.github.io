# averaged

# averaged.F90

## 功能概述
计算单个边界面的流量统计（面积、加权速度和热力学属性）。配合 `average_flow.F90` 使用，对入口（inflow）或出口（outflow）边界进行遍历，累积面积加权的物理量。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `averaged` | 计算单个边界面的流量统计 |

## 算法描述

### 1. 入口边界处理
- **边界类型**：-1（inflow）、-10、-12
- **累积量**：
  - 面积 `area_in`
  - 法向速度 `vnorm * da`
  - 压力 `p * da`
  - 密度 `rho * da`
  - 温度 `temp * da`
  - 马赫数 `Mach * da`

### 2. 出口边界处理
- **边界类型**：-2（outflow）、-6、-60、-62
- **累积量**：同入口，但法向速度取负（流出）

### 3. 关键步骤
1. 调用 `normal` 计算边界法向量
2. 计算法向速度 `vnorm = u*nx + v*ny + w*nz`
3. 调用 `speedofsound` 计算当地音速
4. 计算马赫数 `Mach = |V| / c`

## 关键变量

### 输入
| 变量 | 说明 |
|------|------|
| `u, v, w` | 速度分量数组 |
| `ibs` | 边界标记数组 |
| `inflowps, outflowps` | 入口/出口面编号映射 |

### 输出
| 变量 | 说明 |
|------|------|
| `area_in/out` | 累积面积 |
| `averaged_inflow/out` | 加权物理量 (v,p,rho,T,Mach) |

## 依赖
- `chemistry`：物种数 nsp、随机场 fsc、温度 temp
- `extras`：法向量计算 (nx, ny, nz, da)
- `arrays`：密度 rho、压力 p

