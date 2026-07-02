# inprofile

# inprofile.F90 - 入口/出口边界条件设置

> **源文件**: `0.src.TCR.dyn728/inprofile.F90`
> **功能**: 设置入口和出口边界条件参数

---

## 1. 程序概述

设置流场初始化和边界条件，包括：
- 入口边界 (inlet)
- 出口边界 (outlet)
- 燃料/空气流股参数

---

## 2. 主要变量

### 2.1 边界计数

```fortran
nip = 4  ! 入口边界数量
nop = 1  ! 出口边界数量
```

### 2.2 物种索引

| 变量 | 物种 |
|------|------|
| `jco2` | CO₂ |
| `jh2` | H₂ |
| `jh2o` | H₂O |
| `jo2` | O₂ |
| `jn2` | N₂ |
| `jc3h8` | C₃H₈ |

---

## 3. 数组分配

### 3.1 入口/出口数组

```fortran
allocate(area_in(nip), inflow_header(nip), area_out(nop), outflow_header(nop))

! 可压缩流动
if (compressible) then
    allocate(averaged_inflow(nip,5), averaged_outflow(nop,5), array(5))
else
    allocate(averaged_inflow(nip,4), averaged_outflow(nop,4), array(4))
endif
```

### 3.2 平均流动数组

| 索引 | 内容 (不可压缩) | 内容 (可压缩) |
|------|----------------|---------------|
| 1 | U | U |
| 2 | V | V |
| 3 | W | W |
| 4 | - | T |
| 5 | - | P |

---

## 4. 边界条件类型

### 4.1 入口边界

| 类型 | 说明 |
|------|------|
| 空气入口 | 空气流股参数 |
| 燃料入口 | 燃料流股参数 |
| 伴流入口 | 伴流空气参数 |

### 4.2 出口边界

| 类型 | 说明 |
|------|------|
| 零梯度出口 | 压力出口 |

---

## 5. 关键参数

### 5.1 速度参数

```fortran
real :: v_air, v_fuel      ! 空气/燃料速度
real :: u_max               ! 最大速度
```

### 5.2 密度参数

```fortran
real :: den_air, den_fuel   ! 空气/燃料密度
```

### 5.3 几何参数

```fortran
real :: radius              ! 喷嘴半径
real :: diameter_jet        ! 喷嘴直径
real :: area_air, area_fuel ! 入口面积
```

---

## 6. 物种赋值

根据物种名称自动识别索引：

```fortran
do isp = 1, nsp
    if (names(isp) == 'CO2') jco2 = isp
    if (names(isp) == 'H2') jh2 = isp
    if (names(isp) == 'H2O') jh2o = isp
    if (names(isp) == 'O2') jo2 = isp
    if (names(isp) == 'N2') jn2 = isp
    if (names(isp) == 'C3H8') jc3h8 = isp
enddo
```

---

## 7. 使用说明

此子程序在 `start_init.F90` 中被调用，设置初始流场和边界条件参数。

---

*最后更新: 2026-03-26*


