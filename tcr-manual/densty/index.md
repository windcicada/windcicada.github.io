# densty

# densty.F90 - Density Calculation

## 概述

`densty` 子程序计算流体密度。根据可压缩/不可压缩流动条件，采用不同的状态方程。

## 调用关系

- **调用者**: `boffin.F90` 主程序
- **使用模块**: `arrays`, `chemistry`, `global`, `sgs_pdf`

## 核心算法

### 不可压缩模式

```fortran
rho(ijk) = pressr / (sumn * gascon * temp)
```

其中：
- `pressr` - 参考压力 (Pa)
- `sumn` - 摩尔数 (kmol/kg)
- `gascon` - 气体常数
- `temp` - 温度 (K)

### 可压缩模式

```fortran
drhodp(ijk) = 1.0 / (sumn * gascon * temp)
rho(ijk) = p(ijk) * drhodp(ijk)
```

### 摩尔分数计算

```fortran
yo2 = 1.0 / (wm(O2) + wm(N2)/onr)
yn2 = yo2 / onr
sumn = yo2 + yn2
```

其中：
- `wm` - 分子量 (kg/kmol)
- `onr` - 氧氮摩尔比

## 关键变量

| 变量 | 说明 |
|------|------|
| `pressr` | 参考压力 |
| `gascon` | 通用气体常数 R |
| `drhodp` | ∂ρ/∂p 用于压力耦合 |
| `fsc` | 组分质量分数数组 |

## 错误处理

当焓值为负时，程序终止：

```fortran
if (enth <= 0.0) then
  write(mout,*) 'h=', enth, 'temp=', temp(ijk)
  call boffin_stop(__FILE__, __LINE__)
endif
```

## 物种数据

- **O2**: 氧气质量分数
- **N2**: 氮气质量分数
- 基于空气组成假设 (21% O2, 79% N2)

