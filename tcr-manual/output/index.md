# output

# output.F90 - 求解器输出子程序

## 1. 程序概述

`output` 子程序负责在每个时间步结束时输出计算结果的**统计信息**和**性能指标**，包括燃料流量、守恒残差、极值统计等。

## 2. 调用关系

```
boffin.F90 (主循环)
    └── output()  ← 每个时间步结束时调用
```

## 3. 功能说明

### 3.1 主要输出内容

| 类别 | 内容 |
|------|------|
| 时间信息 | 迭代步数 `istep`、物理时间 `tim`、时间步长 `dt` |
| 粘度 | 分子粘度极值 (vmax/vmin)、SGS 粘度极值 (gamax/gamin) |
| 压力修正 | dsum/dmax 残差 (压力修正方程收敛) |
| 当量比 | Equivalence ratio (psi)、混合分数 (ff) |
| 质量流量 | 入口/出口空气流量 (floin/flout)、燃料流量 (fuin/fuout) |
| 数值判据 | 扩散数 (diffnum)、对流数 (cou)、Peclet 数 (pec) |
| 变量极值 | 所有求解变量的 max/min 及位置 |
| 热损失 | 辐射散热 (radiative_heat_loss)、释热率 (heat_release_rate)、壁面热损失 (wall_heat_loss) |

### 3.2 燃料流量计算

```fortran
! 从入口和出口面计算燃料质量流量
if (ibs(j,k) == -1 .or. ibs(j,k) == -10 .or. ibs(j,k) == -12) then
  fuin = fuin + gi(ijk) * fsc(jfuel0, ijks)  ! 入口
elseif (ibs(j,k) == -2 .or. ibs(j,k) == -60 .or. ibs(j,k) == -62) then
  fuout = fuout - gi(ijk) * fsc(jfuel0, ijks)  ! 出口
endif
```

### 3.3 当量比计算

$$\psi = \nu \cdot \frac{f_f}{f_{air}} \cdot \frac{w_{air}}{w_{fuel}}$$

其中：
- $\nu$ = 化学当量比参数
- $f_f$ = 燃料质量分数
- $w_{air}$ / $w_{fuel}$ = 空气/燃料分子量

## 4. 代码结构

```fortran
subroutine output
  use arrays
  use chemistry
  use exchange
  use global
  use sgs_pdf

  implicit none
  integer :: i,j,k,ijk,ijks,ijkn,ijkw,ijke,ijkl,ijkr,jo2,jn2,jh2,jco2
  real :: fuin, fuout, volume, wfuel, nu, jfuel0

  ! ========== 1. 警告检查 ==========
  call mpi_allreduce(mpi_in_place, iwarn, 1, mpi_integer, mpi_max, mpi_comm_world, info)

  ! ========== 2. 物种索引查找 ==========
  do isp = 1, nsp
    if (names(isp) == 'CO2') jco2 = isp
    if (names(isp) == 'O2') jo2 = isp
    if (names(isp) == 'N2') jn2 = isp
    if (names(isp) == 'H2') jh2 = isp
  enddo

  ! ========== 3. 燃料流量计算 (入口和出口) ==========
  fuin = 0.0
  fuout = 0.0
  ! ... X 方向边界
  ! ... Y 方向边界
  ! ... Z 方向边界

  ! MPI 归约 (所有进程求和)
  call mpi_allreduce(mpi_in_place, fuin, 1, mpi_real, mpi_sum, mpi_comm_world, info)
  call mpi_allreduce(mpi_in_place, fuout, 1, mpi_real, mpi_sum, mpi_comm_world, info)

  ! 燃料质量换算
  if (jfuel == jh2 .or. H2_content == 1.0) then
    fuin = fuin * sngl(wm(jh2))
    fuout = fuout * sngl(wm(jh2))
    wfuel = wm(jh2)
  else
    ! ... 其他燃料处理
  endif

  ! ========== 4. 当量比和混合分数 ==========
  ff = fuin / floin
  wair = wm(jo2) + wm(jn2) / onr
  nu = ...  ! 化学参数
  psi = nu * ff * wair / (wfuel * (1.0 - ff))

  ! ========== 5. 屏幕输出 (仅 master 进程) ==========
  if (master) then
    write(scrn,*) '%%...'
    write(scrn,*) 'istep=', istep, ' time=', tim, ' dt=', dtim
    write(scrn,*) 'Maximum molecular viscosity=', vmax, ' Maximum sgs viscosity=', gamax
    ! ... 更多统计输出
  endif

  ! ========== 6. 文件输出 (跳过条件) ==========
  if (mod(istep, nskip) /= 0 .or. istep == 0) return

  ! 写入详细输出文件
  ! ...
end subroutine output
```

## 5. 关键变量

### 5.1 燃料相关

| 变量 | 含义 |
|------|------|
| `fuin` | 入口燃料质量流量 |
| `fuout` | 出口燃料质量流量 |
| `floin` | 入口空气质量流量 |
| `ff` | 燃料质量分数 |
| `psi` | 当量比 (Equivalence Ratio) |

### 5.2 边界标记

| 标记 | 含义 |
|------|------|
| `-1`, `-10`, `-12` | 入口 (inflow) |
| `-2`, `-60`, `-62` | 出口 (outflow) |

### 5.3 求解器状态

| 变量 | 含义 |
|------|------|
| `dsum` | 压力修正方程残差范数 (L1) |
| `dmax` | 压力修正方程残差范数 (L∞) |
| `resid(nv)` | 各变量收敛残差 |
| `vmax/vmin` | 分子粘度极值 |
| `gamax/gamin` | SGS 粘度极值 |

## 6. 输出控制

### 6.1 屏幕输出频率

- 每个时间步都输出到屏幕 (scrn)

### 6.2 文件输出频率

- 每 `nskip` 步输出到文件 (mout)
- 如果 `nskip = 0` 或 `istep = 0` 则跳过

## 7. MPI 并行说明

```fortran
! 燃料流量需要所有域求和
call mpi_allreduce(mpi_in_place, fuin, 1, mpi_real, mpi_sum, mpi_comm_world, info)

! 警告信息需要所有域取最大值
call mpi_allreduce(mpi_in_place, iwarn, 1, mpi_integer, mpi_max, mpi_comm_world, info)
```

## 8. 注意事项

1. **仅 master 输出**：屏幕输出只在 `master = .true.` 的进程执行
2. **燃料类型**：区分 H2、氨气、碳氢燃料的处理
3. **PDF vs 非 PDF**：输出格式略有不同
4. **可压缩性**：马赫数输出仅在 `compressible = .true.` 时显示

## 9. 相关文件

| 文件 | 关系 |
|------|------|
| `minmax.F90` | 极值计算 (被 boffin 调用) |
| `probe.F90` | 探针输出 |
| `vtk.F90` | VTK 可视化输出 |
| `boffin.F90` | 调用 output 的主程序 |

