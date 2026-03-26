# input

# input.F90 — 输入文件读取

## 功能概述

读取 `input.d` 配置文件和网格文件，初始化求解器参数。

## 输入文件结构 (input.d)

### 路径配置
```
geodir   - 网格文件目录
resdir   - 结果输出目录  
statdir  - 统计输出目录
```

### 文件格式
```
form     - 网格文件格式 (T=formatted, F=unformatted)
read_restart / write_restart - 重启读写标志
lstep    - 最大时间步数
stepsave - 重启文件保存频率
stepplot - VTK 输出频率
```

### 湍流模型参数
```
sgs_viscosity     - SGS 模型选择
dyn_restart_stress- 动态模型重启
cs0              - Smagorinsky 常数
turbstat / turbread - 湍流统计开关
digit_turb       - 数字湍流选项
```

### 求解器参数
```
niter   - 迭代次数上限
tlast   - 物理终止时间
nskip   - 统计跳过步数
cflmin/cflmax/cfl_ok - CFL 数限制
```

### 燃烧参数
```
fuel              - 燃料类型
reaction_mechanism - 反应机理
co2_content/h2_content - 燃料 CO2/H2 含量
burn             - 燃烧开关
chemkin_format   - ChemKin 格式标志
solver           - 化学求解器 (vode/...)
```

### PDF 方法参数
```
pdf             - PDF 传输开关
nfield          - 随机场数量
read_pdf/write_pdf - PDF 重启读写
noise_reduction - 噪声削减
```

### 输出选项
```
species_output - 质量分数/摩尔分数输出
radiate        - 辐射换热开关
ignite         - 点火开关
phase_averaging - 相平均开关
compressible   - 可压缩效应开关
sigma/length   - 有效边界参数
```

## 网格文件读取

### 文件路径
```
geofile = path/Decomp/grid_vv.mydom
```

### 格式判断
- **Formatted**: 文本格式，可读
- **Unformatted**: 二进制格式，更紧凑

### 网格数据
| 数据 | 维度 | 说明 |
|------|------|------|
| `xv, yv, zv` | `(lp1+1)*(mp1+1)*(np1+1)` | 顶点坐标 |
| `ibn, ibs` | `mp1*np1` | 入口/出口边界 |
| `ibe, ibw` | `np1*lp1` | 东/西边界 |
| `ibr, ibl` | `lp1*mp1` | 上/下边界 |
| `fnth, fsth` | 3*mp1*np1 | 入口速度边界值 |
| `fest, fwst` | 3*np1*lp1 | 东/西速度边界值 |
| `frht, flft` | 3*lp1*mp1 | 上/下速度边界值 |

### 边界条件数组索引

```
ibn(j,k) - i=lp1 面 (North/出口)
ibs(j,k) - i=1 面 (South/入口)
ibe(k,i) - j=mp1 面 (East)
ibw(k,i) - j=1 面 (West)
ibr(i,j) - k=np1 面 (Right/Top)
ibl(i,j) - k=1 面 (Left/Bottom)
```

## VTK 输出变量设置

当 `pdf = .true.` 时自动开启以下变量：

```fortran
! 关键物种
plot_vtk(jfuel) = .true.     ! 燃料
plot_vtk('O2')   = .true.    ! 氧气
plot_vtk('CO2')  = .true.    ! 二氧化碳
plot_vtk('CO')   = .true.    ! 一氧化碳
plot_vtk('H2O')  = .true.    ! 水蒸气
plot_vtk('OH')   = .true.    ! 羟基
plot_vtk('H2')   = .true.    ! 氢气
plot_vtk('NO')   = .true.    ! 氮氧化物
plot_vtk('N2')   = .true.    ! 氮气

! 热力学变量
plot_vtk(nvT)    = .true.    ! 温度
plot_vtk(nvrho)  = .true.    ! 密度
plot_vtk(nsc)    = .true.    ! 焓
plot_vtk(nvhrr)  = .true.    ! 释热率
plot_vtk(nvf)    = .true.    ! 混合分数
```

## ChemKin 初始化

当 `chemkin_format = .true.` 时：

```fortran
! 链接文件路径
infile = path/Fuels/fuel/reaction_mechanism/linkfile.d

! 调用 ChemKin 初始化
call ckinit(leniwk,lenwrk,lencwk,linkck,lout,ickwrk,rckwrk,cckwrk,nspecies)
```

## VODE 化学求解器配置

当 `solver = 'vode'` 时分配：

```fortran
! 工作数组大小
lrw = 22 + 9*nsp + 2*nsp**2    ! 实数数组长度
liw = 30 + nsp                 ! 整数数组长度

allocate(rwork(lrw))
allocate(iwork_vode(liw))
allocate(atol(nsp))
```

## 网格维度变量

| 变量 | 定义 | 说明 |
|------|------|------|
| `lp1, mp1, np1` | 输入值 | 顶点数 |
| `l, m, n` | `lp1-1` 等 | 单元数 |
| `lm1, mm1, nm1` | `l-1` 等 | 内部单元数 |
| `lp2, mp2, np2` | `lp1+1` 等 | 扩展顶点数 |
| `lp3, mp3, np3` | `lp1+2` 等 | 存储用 |

## 错误检查

```fortran
! 物种数一致性检查
if (nf_g.ne.nf+nsp+1) then
  write(mout,'(2(1x,a,i5))') 'nsp_g=',nf_g-nf-1,'nsp=',nsp
  call boffin_stop( __FILE__, __LINE__ )
endif
```

---
*Generated from input.F90*

