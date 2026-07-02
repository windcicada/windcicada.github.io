# read prof

# read_prof.F90 - 数字湍流入口数据读取子程序

## 1. 程序概述

`read_prof` 子程序从预加载的入口数据数组 `inflowdata` 中读取当前时间步的速度值，并填充到相应的边界面数组中。

## 2. 调用关系

```
boffin.F90 (主循环 - 每个时间步)
    └── read_prof(ip)  ← 为每个入口面调用
```

## 3. 功能说明

### 3.1 数据流

```
inflowdata (预加载) → read_prof → fsth/fnth/fwst/fest/flft/frht (边界数组)
```

### 3.2 入口面支持

| 方向 | 边界数组 | 速度分量 |
|------|----------|----------|
| south (Y-) | `fsth` | U, V, W |
| north (Y+) | `fnth` | U, V, W |
| west (X-) | `fwst` | U, V, W |
| east (X+) | `fest` | U, V, W |
| left (Z-) | `flft` | U, V, W |
| right (Z+) | `frht` | U, V, W |

## 4. 代码解析

```fortran
subroutine read_prof(ip)
  use arrays
  use exchange
  use digital_turbulence
  use global, only : l, m, n, mout

  implicit none
  integer :: i, j, k, ip, nv

  ! 遍历三个速度分量
  do nv = 1, 3
    if (inflow(ip) == 'south') then
      ! 南边界 (Y-)
      do j = 2, m
        do k = 2, n
          if (inflowps(j, k) == ip) then
            fsth(nv, j, k) = inflowdata(ip, inflowcount(ip), nv, j, k)
          endif
        enddo
      enddo

    elseif (inflow(ip) == 'north') then
      ! 北边界 (Y+) - 注意负号
      do j = 2, m
        do k = 2, n
          if (inflowpn(j, k) == ip) then
            fnth(nv, j, k) = -inflowdata(ip, inflowcount(ip), nv, j, k)
          endif
        enddo
      enddo

    elseif (inflow(ip) == 'west') then
      ! 西边界 (X-)
      do i = 2, l
        do k = 2, n
          if (inflowpw(k, i) == ip) then
            fwst(nv, k, i) = inflowdata(ip, inflowcount(ip), nv, k, i)
          endif
        enddo
      enddo

    elseif (inflow(ip) == 'east') then
      ! 东边界 (X+)
      do i = 2, l
        do k = 2, n
          if (inflowpe(k, i) == ip) then
            fest(nv, k, i) = inflowdata(ip, inflowcount(ip), nv, k, i)
          endif
        enddo
      enddo

    elseif (inflow(ip) == 'left') then
      ! 左边界 (Z-)
      do i = 2, l
        do j = 2, m
          if (inflowpl(i, j) == ip) then
            flft(nv, i, j) = inflowdata(ip, inflowcount(ip), nv, i, j)
          endif
        enddo
      enddo

    elseif (inflow(ip) == 'right') then
      ! 右边界 (Z+)
      do i = 2, l
        do j = 2, m
          if (inflowpr(i, j) == ip) then
            frht(nv, i, j) = inflowdata(ip, inflowcount(ip), nv, i, j)
          endif
        enddo
      enddo
    endif
  enddo
end subroutine read_prof
```

## 5. 关键变量

### 5.1 输入参数

| 参数 | 含义 |
|------|------|
| `ip` | 入口面编号 (1-4) |

### 5.2 内部变量

| 变量 | 含义 |
|------|------|
| `inflowdata(ip, nt, nv, j, k)` | 预加载的入口数据 |
| `inflowcount(ip)` | 当前时间步索引 |
| `inflowps/inflowpn` | 南北边界入口标记 |
| `inflowpw/inflowpe` | 东西边界入口标记 |
| `inflowpl/inflowpr` | 左右边界入口标记 |

### 5.3 输出数组

| 数组 | 含义 |
|------|------|
| `fsth(nv, j, k)` | 南边界速度 |
| `fnth(nv, j, k)` | 北边界速度 |
| `fwst(nv, k, i)` | 西边界速度 |
| `fest(nv, k, i)` | 东边界速度 |
| `flft(nv, i, j)` | 左边界速度 |
| `frht(nv, i, j)` | 右边界速度 |

## 6. 物理说明

### 6.1 边界条件方向

- **south/west/left**: 正向速度直接赋值
- **north/east/right**: 速度取反（坐标方向相反）

### 6.2 时间循环

`inflowcount(ip)` 在每个时间步更新，实现入口数据的时间推进：

```fortran
! 在主循环中
inflowcount(ip) = mod(inflowcount(ip), Ntsteps(ip)) + 1
```

## 7. 使用场景

`read_prof` 在以下位置被调用：
- `openinflow.F90` - 设置入口边界条件
- 时间循环内每个时间步

## 8. 相关文件

| 文件 | 关系 |
|------|------|
| `profile.F90` | 预加载入口数据 |
| `openinflow.F90` | 应用入口边界条件 |
| `module_digital_turbulence.F90` | 入口数据模块 |

