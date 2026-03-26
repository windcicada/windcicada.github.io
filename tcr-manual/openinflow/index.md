# openinflow

# openinflow.F90 - 数字湍流入口初始化子程序

## 1. 程序概述

`openinflow` 子程序负责**数字湍流入口边界**的初始化，包括读取入口数据文件和确定入口面方向。

## 2. 调用关系

```
start_init.F90 (初始化阶段)
    └── openinflow()  ← 在启动时调用
```

## 3. 功能说明

### 3.1 主要功能

1. **读取入口配置**：从 `digit_info_{ip}.d` 文件读取网格信息
2. **分配数据数组**：`inflowdata(nip, ntmax, 3, nmax, nmax)`
3. **确定入口方向**：south/north/west/east/left/right
4. **加载入口数据**：调用 `profile` 子程序读取速度时序

## 4. 代码解析

```fortran
subroutine openinflow
  use arrays
  use digital_turbulence
  use global, only : nvu, nvv, nvw, infile, mout, &
                     scrn, lin, l, n, m, nip, imax, jmax, kmax, path

  implicit none
  integer :: i, j, k, ip, ntmax, nmax
  logical :: yes

  ! ========== 1. 读取入口配置 ==========
  do ip = 1, nip
    write(infile, '(2a,i1.1,a)') trim(path), &
                               '/digit_inflow/digit_info_', ip, '.d'
    inquire(file=infile, exist=yes)
    if (yes) then
      open(unit=lin, file=infile, status='unknown')
      read(lin, *) indy, indz, Ntsteps(ip), mt, Lt(ip), Convection_velocity(ip)
    endif
  enddo
  close(lin)

  ! ========== 2. 确定数据尺寸并分配数组 ==========
  ntmax = maxval(ntsteps(:))
  nmax = max(l, m, n)
  allocate(inflowdata(1:nip, 1:ntmax, 1:3, 1:nmax, 1:nmax))

  ! ========== 3. 查找入口面 ==========
  inflow(:) = 'null'

  do ip = 1, nip
    write(infile, '(a,i1.1,a)') './digit_inflow/digit_info_', ip, '.d'
    inquire(file=infile, exist=yes)
    if (yes) then
      ! 检查 Y 方向边界
      do j = 2, m
        do k = 2, n
          if (inflowps(j, k) == ip) inflow(ip) = 'south'
          if (inflowpn(j, k) == ip) inflow(ip) = 'north'
        enddo
      enddo

      ! 检查 X 方向边界
      do i = 2, l
        do k = 2, n
          if (inflowpw(k, i) == ip) inflow(ip) = 'west'
          if (inflowpe(k, i) == ip) inflow(ip) = 'east'
        enddo
      enddo

      ! 检查 Z 方向边界
      do i = 2, l
        do j = 2, m
          if (inflowpl(i, j) == ip) inflow(ip) = 'left'
          if (inflowpr(i, j) == ip) inflow(ip) = 'right'
        enddo
      enddo
      inflow(ip) = trim(inflow(ip))
    endif
  enddo

  ! ========== 4. 加载入口数据 ==========
  do ip = 1, nip
    write(infile, '(a,i1.1,a)') './digit_inflow/digit_info_', ip, '.d'
    inquire(file=infile, exist=yes)
    if (yes) then
      if (inflow(ip) == 'south') then
        i = 2
        call profile(ip, i, io(2), m, jo(2), n, ko(2), io, jo, ko, imax, jmax, kmax)
      elseif (inflow(ip) == 'north') then
        i = l
        call profile(ip, i, -io(2), m, jo(2), n, ko(2), io, jo, ko, imax, jmax, kmax)
      elseif (inflow(ip) == 'west') then
        j = 2
        call profile(ip, j, jo(2), n, ko(2), l, io(2), jo, ko, io, jmax, kmax, imax)
      elseif (inflow(ip) == 'east') then
        j = m
        call profile(ip, j, -jo(2), n, ko(2), l, io(2), jo, ko, io, jmax, kmax, imax)
      elseif (inflow(ip) == 'left') then
        k = 2
        call profile(ip, k, ko(2), l, io(2), m, jo(2), ko, io, jo, kmax, imax, jmax)
      elseif (inflow(ip) == 'right') then
        k = n
        call profile(ip, k, -ko(2), l, io(2), m, jo(2), ko, io, jo, kmax, imax, jmax)
      endif
    endif
  enddo

end subroutine openinflow
```

## 5. 关键变量

### 5.1 配置参数

| 变量 | 含义 |
|------|------|
| `nip` | 入口面数量 |
| `indy, indz` | 入口数据网格尺寸 |
| `Ntsteps(ip)` | 入口数据时间步数 |
| `mt` | 时间循环参数 |
| `Lt(ip)` | 对流长度尺度 |
| `Convection_velocity(ip)` | 对流速度 |

### 5.2 数据数组

| 变量 | 维度 | 含义 |
|------|------|------|
| `inflowdata(ip, nt, nv, j, k)` | 5D | 入口速度数据 |
| `inflow(ip)` | 1D | 入口方向字符串 |

### 5.3 入口面标记

| 标记数组 | 含义 |
|----------|------|
| `inflowps(j,k)` | 南边界入口标记 |
| `inflowpn(j,k)` | 北边界入口标记 |
| `inflowpw(k,i)` | 西边界入口标记 |
| `inflowpe(k,i)` | 东边界入口标记 |
| `inflowpl(i,j)` | 左边界入口标记 |
| `inflowpr(i,j)` | 右边界入口标记 |

## 6. 入口方向判断

程序通过检查入口标记数组确定入口方向：

```
inflowps(j,k) == ip → south (Y-)
inflowpn(j,k) == ip → north (Y+)
inflowpw(k,i) == ip → west (X-)
inflowpe(k,i) == ip → east (X+)
inflowpl(i,j) == ip → left (Z-)
inflowpr(i,j) == ip → right (Z+)
```

## 7. 相关文件

| 文件 | 关系 |
|------|------|
| `profile.F90` | 读取入口数据 |
| `read_prof.F90` | 时间循环中读取数据 |
| `digital_turbulence` 模块 | 入口数据定义 |
| `bndry1.F90` | 应用入口边界条件 |

