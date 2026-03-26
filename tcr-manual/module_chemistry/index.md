# module chemistry

# module_chemistry.F90 — 化学模块

## 功能概述

声明化学反应和热力学相关的全局变量。

## 燃料与机理

```fortran
character(len=25)  :: fuel                  ! 燃料类型
character(len=25)  :: reaction_mechanism    ! 反应机理名称
character(len=12)  :: names(200)             ! 物种名称数组
character(len=2)   :: element_name(6)       ! 元素名称
```

## 变量索引

| 变量 | 用途 |
|------|------|
| `nvhc` | 碳氢化合物索引 |
| `nvco` | CO 索引 |
| `nvco2` | CO2 索引 |
| `nvh2` | H2 索引 |
| `nvh2o` | H2O 索引 |
| `nvo2` | O2 索引 |
| `nvn2` | N2 索引 |
| `nvden` | 密度索引 |
| `nvtemp` | 温度索引 |

## 物种索引

```fortran
integer :: jfuel        ! 燃料
integer :: jch3oh       ! 甲醇
integer :: jc7h16       ! 庚烷
integer :: jc12h23     ! 烷烃
integer :: jc2h5oh     ! 乙醇
integer :: joxygen     ! 氧气
integer :: jproduct    ! 产物
```

## 计数变量

```fortran
integer :: isp           ! 当前物种索引
integer :: nsc           ! 标量数 (nsp+1)
integer :: nsp           ! 物种数
integer :: nel           ! 元素数
integer :: n_c, n_h, n_o ! C/H/O 原子数
integer :: nreact        ! 反应数
integer :: mpoly         ! 多项式项数
integer :: nchem         ! 化学时间尺度
```

## 热力学常数

```fortran
double precision :: wc1=12.0112    ! C 原子量
double precision :: wh1=1.00797    ! H 原子量
double precision :: wn1=14.0067    ! N 原子量
double precision :: wo1=15.9994    ! O 原子量
double precision :: whe1=4.002602  ! He 原子量
double precision :: war1 = 39.948 ! Ar 原子量
double precision :: gascon=8314.3 ! 气体常数 J/kmol/K
double precision :: onr=0.264     ! O/N 比
```

## 热力学状态

```fortran
double precision :: den           ! 密度
double precision :: enth, enth0, enth1  ! 焓
double precision :: pressr         ! 参考压力
double precision :: theta          ! 温度
double precision :: wair           ! 空气分子量
double precision :: pressure       ! 当前压力

double precision :: hdot_fg        ! 生成热
double precision :: temp_limits(2) ! 温度极限
real :: press_flamelet              ! Flamelet 参考压力
real :: CO2_content, H2_content     ! 燃料 CO2/H2 含量
real :: ff, psi                    ! 其他参数
```

## 数组

```fortran
! 多项式系数
double precision,ALLOCATABLE :: npoly(:)

! 焓变和公共温度
double precision,ALLOCATABLE :: enth_fg(:),temp_common(:)

! Chebyshev 展开系数
double precision,ALLOCATABLE :: CHEBY(:,:)

! 化学工作数组
double precision,ALLOCATABLE :: cjan(:,:,:),yn(:),yold(:),wm(:)
double precision,ALLOCATABLE :: atom(:,:)
```

## PDF 相关数组 (fschem & fsc)

```fortran
! 滤波平均量 (FCHEM)
REAL,ALLOCATABLE :: fschem(:)        ! 大小: nchem

! 随机场样本 (FSC) - 核心数组
REAL,ALLOCATABLE :: fsc(:,:)          ! (nsc, N) = (标量数, 随机场数)
REAL,ALLOCATABLE :: fsc2(:,:)         ! 第二组随机场

! 场平均温度和求和
REAL,ALLOCATABLE :: temp(:),sumn(:)   ! 场平均温度、摩尔数求和

! 每场的热力学属性
REAL,ALLOCATABLE :: field_hdot(:,:),field_density(:,:), &
                   field_temperature(:,:),field_qdot_rad(:,:)
REAL,ALLOCATABLE :: heat_fg(:),qdot_rad(:)
```

### fsc 数组结构 (nsc × nfield)

```
fsc(1:nsp, :)     - 物种质量分数
fsc(nsp+1, :)     - 混合分数 Z
fsc(nsp+2, :)     - 焓 h
fsc(nsp+3, :)     - 温度 T
```

## TCR 特征时间 (Dong 240410)

```fortran
REAL,ALLOCATABLE :: tim_sp(:,:)      ! 物种特征时间
REAL,ALLOCATABLE :: tim_flow(:)      ! 流动时间尺度
REAL,ALLOCATABLE :: kappa(:,:)       ! PSR 体积分数 κ
REAL,ALLOCATABLE :: temp_i(:)        ! 积分尺度混合时间
REAL,ALLOCATABLE :: temp_k(:)        ! Kolmogorov 尺度混合时间
REAL,ALLOCATABLE :: prev_rdot(:,:)   ! 上一时间步的反应率
REAL,ALLOCATABLE :: arr_eta(:)        ! 反应物体积分数 η
REAL,ALLOCATABLE :: sum_w(:,:)       ! 加权求和
REAL,ALLOCATABLE :: sum_w0(:,:)       ! 加权求和 (t-1)

INTEGER :: dstep_ww0, init_ww0       ! 时间步计数
```

### TCR κ 计算公式

$$\kappa = \frac{\tilde{\omega}_c}{\omega_{c,PSR}}$$

其中 $\omega_c$ 是反应进度变化率。

## Euler 求解器

```fortran
integer :: iopt
integer,parameter :: ntrial = 5
double precision,parameter :: tolf=1.0d+00, tolx = 1.0d-08
```

## VODE 求解器

```fortran
integer :: ipar,istate,itol,itask,lrw,liw,mf
double precision :: rpar,rtol,tin,tout
double precision, allocatable :: atol(:),rwork(:)
integer, allocatable :: iwork_vode(:)
```

## 常用公式

### 混合物分子量
$$W_{mix} = \sum_i X_i W_i$$

### 摩尔分数转质量分数
$$Y_i = \frac{X_i W_i}{W_{mix}}$$

---
*Generated from module_chemistry.F90*
*Last updated: 2026-03-25*

