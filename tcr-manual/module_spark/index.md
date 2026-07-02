# module spark

# module_spark.F90 - 点火/火花塞模块

> **源文件**: `0.src.TCR.dyn728/module_spark.F90`
> **功能**: 火花点火能量沉积 (Spark Energy Deposition) 模型

---

## 1. 模块概述

实现火花点火模型，用于模拟点火过程中的能量沉积。火花能量以高斯分布形式释放在指定位置。

---

## 2. 变量声明

### 2.1 标量变量

| 变量 | 类型 | 说明 |
|------|------|------|
| `nspark` | `integer` | 火花数量 |
| `a` | `real` | 计算参数 |
| `cpair` | `real` | 空气比热容 |
| `deltas` | `real` | 火花空间尺度 |
| `deltat` | `real` | 火花时间尺度 |
| `ei` | `real` | 传输能量 |
| `sigmas` | `real` | 空间标准差 |
| `sigmat` | `real` | 时间标准差 |
| `tair` | `real` | 环境温度 |
| `tmax` | `real` | 最大温度 |
| `tspark` | `real` | 点火时间 |
| `qdot_max` | `real` | 最大体积释热率 |

### 2.2 逻辑变量

| 变量 | 类型 | 说明 |
|------|------|------|
| `spark_ed` | `logical` | 是否启用火花点火 |

### 2.3 数组变量

| 变量 | 维度 | 说明 |
|------|------|------|
| `x_spark(:)` | `(nspark)` | 火花 X 坐标 |
| `y_spark(:)` | `(nspark)` | 火花 Y 坐标 |
| `z_spark(:)` | `(nspark)` | 火花 Z 坐标 |

---

## 3. 子程序

### 3.1 spark_init

```fortran
subroutine spark_init
```

**功能**: 初始化火花参数，从 `spark.d` 文件读取配置

**输入文件**: `spark.d`

```
spark_ed = .true.        ! 是否启用
deltat = 0.0002          ! 火花持续时间 (s)
tspark = 0.001           ! 点火时间 (s)
tair, tmax               ! 空气/最大温度
nspark                   ! 火花数量
x_spark y_spark z_spark  ! 火花位置
```

### 3.2 spark

```fortran
subroutine spark(qdot, x, y, z, x0, y0, z0, t, temp)
```

**功能**: 计算火花释热率

**参数**:
- `qdot` - 输出: 体积释热率
- `x, y, z` - 输入: 当前坐标
- `x0, y0, z0` - 输出: 火花中心坐标
- `t` - 输入: 当前时间
- `temp` - 输入: 当前温度

**算法**:

```fortran
! 默认位置
x0 = 0.050
y0 = 0.000
z0 = 0.000

! 径向距离
r = sqrt((y-y0)² + (z-z0)²)

! 高斯分布
arg = (r/sigmas)²
if (arg < 9.210 .and. temp < 1500.0) then
    qdot = 3 * qdot_max * exp(-0.5 * arg)
else
    qdot = 0.0
endif
```

**限制条件**:
- 仅在 $x \in [0.04, 0.05]$ 区域激活
- 仅在 `istep ∈ [10, 1000]` 期间激活
- 温度低于 1500K

---

## 4. 能量模型

### 4.1 参数计算

```fortran
a = 4.0 * sqrt(log(10.0))
arg = (ei / (cpair * (tmax - tair)))^(1/3)
deltas = sqrt(a/pi) * arg
sigmas = deltas / a
sigmat = deltat / a
qdot_max = 0.25 * ei / (PI² * sigmas³ * sigmat)
```

### 4.2 能量分布

- 98% 能量释放在 `deltas³ × deltat` 体积-时间区域内
- 空间分布: 3D 高斯分布
- 时间分布: 1D 高斯分布

---

## 5. 输入文件格式

```fortran
! spark.d
.logical.         ! spark_ed
.deltat           ! 火花持续时间 (s)
.tspark           ! 点火时间 (s)
.tair .tmax       ! 温度范围 (K)
.nspark           ! 火花数量
x1 y1 z1          ! 火花1坐标
x2 y2 z2          ! 火花2坐标
...
```

---

## 6. 使用说明

在 `input.F90` 中设置 `spark_ed=.true.` 并配置 `spark.d` 文件。

---

*最后更新: 2026-03-26*


