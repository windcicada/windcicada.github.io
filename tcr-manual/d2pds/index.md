# d2pds

# d2pds.F90 - Pressure Smoothing

## 概述

`d2pds` 子程序实现压力平滑（pressure smoothing）算法，用于减轻压力场的非物理振荡。该算法通过计算三阶导数来平滑压力场。

## 调用关系

- **调用者**: 主程序 `boffin.F90` 中的压力求解循环
- **调用模块**: `arrays`, `global`

## 核心算法

### 压力三阶导数计算

压力平滑的核心是计算压力的三阶导数：

```fortran
d3pdi = tin*dpdin + tip*dpdip - 2.0*ti*dpdi
```

其中：
- `ti` - 当前单元的雅可比行列式逆
- `tin`, `tip` - 相邻单元的雅可比逆
- `dpdi` - 一阶导数
- `dpdin`, `dpdip` - 相邻单元的一阶导数

### 雅可比计算

使用坐标导数计算雅可比行列式及其逆：

```fortran
dxdi = (x(ijkn)-x(ijk))
dy = ...
dz = ...
ajn = dxdi*(dydj*dzdk-dydk*dzdj) - dxdj*(dyi*dzdk-dyk*dzi) + dxdk*(dyi*dzj-dyj*dzi)
```

### 边界处理

根据边界类型调整索引范围：
- **出口边界** (`ibs == -6, -60, -62, -100`): 从 i=1 开始
- **非出口边界**: 从 i=2 开始

```fortran
if (outflow_s .or. ibs(j,k) == -100) then
  istr = 1
else
  istr = 2
end if
```

## 输入参数

| 参数 | 说明 |
|------|------|
| `l,m,n` | 网格尺寸 |
| `gi` | 输出：压力平滑贡献 |
| `ibn,ibs` | 边界标记数组 |

## 输出参数

- `gi` - 累积到动量方程源项的压力平滑贡献

## 关键公式

**压力修正项**:
```fortran
gi(ijkn) = gi(ijkn) + alpha * dtim * d3pdi
```

其中 `alpha` 是松弛因子，`dtim` 是时间步长。

## 注意事项

1. 仅在内部单元（i=2:l, j=2:m, k=2:n）计算
2. 出口边界使用对称处理
3. 需要网格坐标 `x,y,z` 计算几何导数

