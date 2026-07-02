# probe

# probe.F90 - 探针输出子程序

## 1. 程序概述

`probe` 子程序负责输出指定监测点的**时序数据**，用于分析流场中特定位置的物理量变化。

## 2. 调用关系

```
boffin.F90 (主循环)
    └── probe(u,v,w)  ← 每个时间步调用
```

## 3. 功能说明

### 3.1 探针配置

探针在初始化阶段设置（`start_probe.F90`）：
- 监测位置 (cell_probe)
- 所属域 (dom_probe)
- 输出文件 (pout)

### 3.2 输出变量

| 输出模式 | 输出内容 |
|----------|----------|
| 摩尔分数 | 时间、压力、温度、热释放率、密度、燃料摩尔分数 |
| 质量分数 | 时间、压力、速度分量、温度、热释放率、密度、SGS动能、OH/H/H2/O2 反应率 |

## 4. 代码解析

```fortran
subroutine probe(u,v,w)
  use arrays, only : p, cell_probe, dom_probe, rho, q
  use chemistry, only : fsc, sumn, temp, wm, jfuel, names, heat_fg, isp, nsp
  use exchange
  use global
  use sgs_pdf

  real :: u(lower:upper), v(lower:upper), w(lower:upper)
  real :: m_fraction
  integer :: joh, jh, jh2, jo2

  ! ========== 1. 物种索引查找 ==========
  do isp = 1, nsp 
    if (names(isp) == 'OH') then
      joh = isp
    elseif (names(isp) == 'H') then
      jh = isp
    elseif (names(isp) == 'H2') then
      jh2 = isp
    elseif (names(isp) == 'O2') then
      jo2 = isp
    endif
  enddo

  ! ========== 2. 遍历所有探针 ==========
  do i = 1, n_probe
    ! 仅处理本域内的探针
    if (dom_probe(i) == mydom) then
      if (species_output == 'mole_fraction') then
        ! 摩尔分数模式
        m_fraction = fsc(jfuel, cell_probe(i)) * sngl(wm(jfuel))
        write(pout(i), '(1p,5(a,e15.7))') 'mole, ', tim, &
           ', ', p(cell_probe(i)), &
           ', ', temp(cell_probe(i)), &
           ', ', heat_fg(cell_probe(i)), &
           ', ', rho(cell_probe(i))

      elseif (species_output == 'mass_fraction') then
        ! 质量分数模式
        m_fraction = fsc(jfuel, cell_probe(i)) / sumn(cell_probe(i))
        write(pout(i), '(1p,13(a,e15.7))') 'mass, ', tim, &
           ', ', p(cell_probe(i)), &
           ', ', u(cell_probe(i)), &
           ', ', v(cell_probe(i)), &
           ', ', w(cell_probe(i)), &
           ', ', temp(cell_probe(i)), &
           ', ', heat_fg(cell_probe(i)), &
           ', ', rho(cell_probe(i)), &
           ', ', q(cell_probe(i)), &
           ', ', rdot(joh, cell_probe(i)), &
           ', ', rdot(jh, cell_probe(i)), &
           ', ', rdot(jh2, cell_probe(i)), &
           ', ', rdot(jo2, cell_probe(i))
      endif
    endif
  enddo
end subroutine probe
```

## 5. 关键变量

### 5.1 探针配置

| 变量 | 含义 |
|------|------|
| `n_probe` | 探针总数 |
| `cell_probe(i)` | 第 i 个探针的网格单元索引 |
| `dom_probe(i)` | 第 i 个探针所属的 MPI 域 |
| `pout(i)` | 第 i 个探针的输出文件单元 |

### 5.2 物种相关

| 变量 | 含义 |
|------|------|
| `jfuel` | 燃料物种索引 |
| `joh`, `jh`, `jh2`, `jo2` | 自由基/反应物物种索引 |
| `fsc(isp,ijk)` | 物种平均质量分数 |
| `sumn(ijk)` | 摩尔数总和 |
| `rdot(isp,ijk)` | 物种反应率 |

### 5.3 流场变量

| 变量 | 含义 |
|------|------|
| `p` | 压力 |
| `temp` | 温度 |
| `rho` | 密度 |
| `q` | SGS 动能 |
| `heat_fg` | 生成焓 |

## 6. 输出格式

### 6.1 摩尔分数模式

```
mole, 1.2345678E+00, 1.0000000E+05, 5.0000000E+02, -2.0000000E+05, 1.2000000E+00
       ↑时间            ↑压力         ↑温度         ↑生成焓           ↑密度
```

### 6.2 质量分数模式

```
mass, 1.2345678E+00, 1.0000000E+05, 1.5000000E+01, 2.0000000E+00, ...
       ↑时间            ↑压力         ↑U            ↑V              ...
```

## 7. 注意事项

1. **域筛选**：`dom_probe(i) == mydom` 确保只有所属域输出
2. **物种输出模式**：根据 `species_output` 选择输出格式
3. **自由基追踪**：主要输出 OH、H、H2、O2 的反应率用于燃烧诊断

## 8. 相关文件

| 文件 | 关系 |
|------|------|
| `start_probe.F90` | 探针初始化 |
| `output.F90` | 常规输出 |
| `boffin.F90` | 调用 probe 的主程序 |

