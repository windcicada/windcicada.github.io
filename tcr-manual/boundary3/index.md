# boundary3

# boundary3.F90

## 功能概述
处理速度分量的边界条件实现。根据边界类型设置速度值或应用特殊处理（如壁面函数、特征线边界）。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `boundary3` | 速度边界条件设置 |

## 边界处理

### 1. 压力修正 (nv == nvdp)
- **常压入口 (-6)**：
  - 可压缩：压力设为 `pressr`
  - 不可压缩：压力设为 0

- **其他边界**：零梯度外推
```fortran
ddpds = (f(ijkn) - f(ijkp)) / ds
f(ijks) = f(ijkp) - ddpds * dsp
```

### 2. 速度分量 (nv == nvu/nvv/nvw)
根据边界类型处理：
- 入口/出口
- 对称面
- 壁面（无滑移/滑移）

### 3. 标量变量
处理混合分数、焓、物种等的边界值。

## 关键算法
```fortran
! 距离计算
ds = sqrt((x_ijkn-x_ijk)^2 + (y_ijkn-y_ijk)^2 + (z_ijkn-z_ijk)^2)
dsp = sqrt((x_ijk-x_ijks)^2 + (y_ijk-y_ijks)^2 + (z_ijk-z_ijks)^2)
! 梯度计算
ddpds = (f(ijkn) - f(ijkp)) / ds
f(ijks) = f(ijkp) - ddpds * dsp
```

## 依赖模块
- `arrays`：流场数组 (f, x, y, z, p)
- `chemistry`：标量数 nsc
- `global`：变量索引 (nvu, nvv, nvw, nvdp, nvh)
- `sgs_pdf`：随机场信息

