# start read

# start_read.F90 - 重启文件读取子程序

## 1. 程序概述

`start_read` 子程序负责从**重启文件**中读取流场数据，使求解器能够从之前中断的计算继续运行。

## 2. 调用关系

```
boffin.F90 (启动阶段)
    └── start_read()  ← 仅在重启模式时调用
```

## 3. 功能说明

### 3.1 读取内容

| 数据类型 | 内容 | 文件 |
|----------|------|------|
| 流场数据 | 速度、压力、混合分数等 | `restart.{mydom}` |
| 统计量 | 时间平均量、方差等 | `restart.stat.{mydom}` |
| 数字湍流 | 入口生成参数 | `restart.digit_turb.{mydom}` |

### 3.2 重启信息

- **迭代步数**: `istep`
- **物理时间**: `tim`
- **时间步长**: `dtim`

## 4. 代码解析

```fortran
subroutine start_read
  use arrays
  use chemistry
  use digital_turbulence
  use exchange
  use global
  use sgs_pdf

  implicit none
  integer :: ia, ie, ijk
  logical :: yes

  ! ========== 1. 打开重启文件 ==========
  write(resfile, '(2a,i3.3)') trim(path), '/Restart/restart.', mydom
  open(nout, file=resfile, status='old', form='unformatted', err=8000)

  ! ========== 2. 读取基本时间信息 ==========
  read(nout) istep, tim, dtim
  
  ! MPI 同步时间和迭代步
  call mpi_allreduce(mpi_in_place, tim, 1, MPI_REAL, mpi_max, mpi_comm_world, info)
  call mpi_allreduce(mpi_in_place, istep, 1, MPI_INTEGER, mpi_max, mpi_comm_world, info)

  ! ========== 3. 读取流场变量 ==========
  do nv = 1, nf
    ia = nfo(nv) + lower
    ie = nfo(nv) + upper
    read(nout) f(ia:ie)
  enddo

  ! 读取压力
  read(nout) p(:)

  ! 读取混合分数
  read(nout) (f(nfo(nvf) + ijk), ijk = lower, upper)

  ! ========== 4. SGS 模型常数 ==========
  if (sgs_viscosity == 'dyn_stress_piomelli') then
    if (dyn_restart_stress) then
      read(nout) cs(:)  ! 读取存储的动态模型常数
    else
      cs(:) = cs0  ! 重置为默认值
    endif
  elseif (sgs_viscosity == 'vreman') then
    cs(:) = 2.5 * cs0**2
  endif

  close(nout, status='keep')

  ! ========== 5. 更新总迭代步 ==========
  lstep = lstep + istep

  ! ========== 6. 读取统计量 (可选) ==========
  if (turbread) then
    write(statfile, '(2a,i3.3)') trim(path), '/Restart/restart.stat.', mydom
    open(statout, file=statfile, status='old', form='unformatted', err=8001)
    
    read(statout) atime  ! 统计平均时间
    read(statout) fstat(:)  ! 统计量数据
    read(statout) ftau(:)  ! 雷诺应力
    read(statout) fschem(:)  ! 化学统计量
    
    close(statout, status='keep')
  else
    atime = 0.0
    fstat(:) = 0.0
    ftau(:) = 0.0
    fschem(:) = 0.0
  endif

  ! ========== 7. 读取数字湍流参数 (可选) ==========
  if (digit_turb) then
    write(resfile, '(2a,i3.3)') trim(path), '/Restart/restart.digit_turb.', mydom
    inquire(file=resfile, exist=yes)
    
    if (yes) then
      open(nin, file=resfile, status='unknown', form='formatted', err=8002)
      read(nin,*) inflowcount(:), njump(:), last(:), iadd(:)
      close(nin, status='keep')
    endif
  endif

  return

  ! ========== 错误处理 ==========
8000 write(mout, *) '-- start_read: ERROR opening restart file --'
  call boffin_stop(__FILE__, __LINE__)
8001 write(mout, *) '-- start_read: ERROR opening restart.stat file'
  call boffin_stop(__FILE__, __LINE__)
8002 write(mout, *) '-- start_read: ERROR opening restart_digit_turb file'
  call boffin_stop(__FILE__, __LINE__)

end subroutine start_read
```

## 5. 关键变量

### 5.1 重启文件路径

```fortran
! 格式: {path}/Restart/restart.{mydom}
resfile = trim(path) // '/Restart/restart.' // mydom
```

### 5.2 读取的变量

| 变量 | 含义 |
|------|------|
| `istep` | 当前时间步编号 |
| `tim` | 物理时间 |
| `dtim` | 时间步长 |
| `f(*)` | 所有流场变量 (速度、标量等) |
| `p` | 压力场 |
| `cs` | SGS 模型常数 |
| `fstat`, `ftau`, `fschem` | 统计量数组 |
| `atime` | 统计平均时间 |

### 5.3 控制标志

| 变量 | 含义 |
|------|------|
| `turbread` | 是否读取统计量 |
| `dyn_restart_stress` | 是否读取动态模型常数 |
| `digit_turb` | 是否使用数字湍流 |

## 6. 格式说明

### 6.1 流场文件格式

- **格式**: 未格式化 (unformatted binary)
- **顺序**:
  1. `istep, tim, dtim` (时间信息)
  2. `f` 数组 (每个变量依次写入)
  3. `p` 数组 (压力)
  4. 混合分数

### 6.2 统计文件格式

- **格式**: 未格式化 binary
- **顺序**: `atime`, `fstat`, `ftau`, `fschem`

## 7. MPI 并行处理

```fortran
! 所有进程同步时间和迭代步
call mpi_allreduce(mpi_in_place, tim, 1, MPI_REAL, mpi_max, mpi_comm_world, info)
call mpi_allreduce(mpi_in_place, istep, 1, MPI_INTEGER, mpi_max, mpi_comm_world, info)
```

每个进程读取自己的重启文件 (`restart.{mydom}`)，然后同步时间和步数。

## 8. 注意事项

1. **每个域独立文件**: `restart.{mydom}` 每个 MPI 进程独立读取
2. **错误处理**: 文件不存在时终止程序
3. **统计量可选**: `turbread` 标志控制是否读取统计信息

## 9. 相关文件

| 文件 | 关系 |
|------|------|
| `start_init.F90` | 首次运行初始化 |
| `output.F90` | 输出重启文件 |
| `boffin.F90` | 调用 start_read 的主程序 |

