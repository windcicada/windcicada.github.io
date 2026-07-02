# react hc

# react_hc.F90

## 功能概述
**碳氢燃料反应求解子程序**。使用 ODE 求解器计算有限速率化学反应。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `react_hc` | 碳氢燃料反应求解 |

## 算法描述

### 1. VODE 求解器
```fortran
call vode_(jac, isp, yn, den, T, pressr, ...)
```
使用 VODE (Variable-coefficient ODE solver) 求解刚性常微分方程组。

### 2. 物种遍历
```fortran
do isp = 1, nsp
  if (trim(names(isp)) == 'N2' .or. trim(names(isp)) == 'AR') then
    jnore = isp  ! 惰性物种
  endif
enddo
```

### 3. 反应源项
```fortran
call chemdot(...)  ! 计算化学源项 wdot
```

### 4. 输出
- `wdot`：物种生成/消耗率
- `hdot_fg`：释热率
- `kappa`：Damköhler 数（时间尺度比）

## 参数
| 参数 | 说明 |
|------|------|
| `dtim` | 时间步长 |
| `ijk` | 网格单元索引 |
| `yn, yold` | 当前/旧物种质量分数 |
| `den` | 密度 |
| `T` | 温度 |

## 依赖模块
- `chemistry`：yn, yold, nsp, solver, wdot, hdot_fg
- `exchange`：master
- `global`：mout, scrn, small
- `sgs_pdf`：ifld

## 备注
该程序使用 Fortran VODE 库求解化学反应 ODE 方程组。

