# module chemkin

# module_chemkin.F90

## 功能概述
**Chemkin 接口模块**。定义 CHEMKIN 子程序所需的工作数组和参数，用于外部化学动力学求解器接口。

## 模块变量

### 数组参数
| 参数 | 大小 | 说明 |
|------|------|------|
| `linkmc` | 35 | CHEMKIN 链接参数 |
| `kdim` | 60 | 物种维度 |
| `leniwk` | 11562 | 整数工作区大小 |
| `lenwrk` | 12417 | 实数工作区大小 |
| `lencwk` | 124 | 字符工作区大小 |
| `lenimc` | 10000 | 接口整数区 |
| `lenrmc` | 70000 | 接口实数区 |

### 分配数组
```fortran
double precision, allocatable :: rckwrk(:)  ! CHEMKIN 实数工作区
double precision, allocatable :: rmcwrk(:) ! 接口实数工作区
double precision, allocatable :: atomicweight(:)  ! 原子量
integer, allocatable :: ickwrk(:)  ! CHEMKIN 整数工作区
integer, allocatable :: imcwrk(:)   ! 接口整数工作区
```

### 标量变量
```fortran
integer :: lencck    !CHEMKIN 长度
integer :: nspecies  !物种数
integer :: ncmc      !接口数
character(len=16) :: cckwrk(124)  !字符工作区
```

## 用途
- 与 CHEMKIN 软件接口
- 读取外部反应机理文件
- 提供化学动力学计算工作区

## 状态
- 当前为占位模块，未完全激活

