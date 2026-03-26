# pbsrhl

# pbsrhl.F90 - MPI 并行通信子程序

## 1. 程序概述

`pbsrhl` (Parallel Boundary Send/Receive Halo) 是 TCR 求解器中的 **MPI Halo 通信** 核心子程序，负责在分布式内存并行计算中交换域边界数据。

## 2. 功能说明

### 2.1 主要功能

- **Halo 数据交换**：将内部单元的数据发送到相邻域
- **接收并填充**：从相邻域接收数据填充本地 Ghost 单元
- **支持多层 Halo**：通过 `hhalo` 参数支持多层通信

### 2.2 通信模式

```
       发送方 (mydom)                    接收方 (target)
    ┌───────────────────┐          ┌───────────────────┐
    │   内部单元数据    │ ───────► │   Ghost 单元区域   │
    └───────────────────┘          └───────────────────┘
```

## 3. 算法说明

### 3.1 通信策略

程序采用 **非阻塞通信** (`MPI_BSEND`) 配合 **阻塞接收** (`MPI_RECV`)：

1. **第一阶段 (idir=0)**：内部到外部传输（域内部数据传输）
2. **第二阶段 (idir=1)**：外部到内部传输（Ghost 区域填充）

### 3.2 数据打包

```fortran
! 从发送域提取数据到临时数组
num = 0
do k = k_start, k_end, k_step
  do j = j_start, j_end, j_step
    do i = i_start, i_end, i_step
      num = num + 1
      temparray(num) = field(1 + io(i) + jo(j) + ko(k))
    enddo
  enddo
enddo

! 发送
call mpi_bsend(temparray, num, mpi_real, target_rank, tag, mpi_comm_world, info)
```

### 3.3 数据解包

```fortran
! 接收数据
call mpi_recv(temparray, num, mpi_real, source_rank, tag, mpi_comm_world, istat, info)

! 填充 Ghost 区域
num = 0
do k = k_start, k_end, k_step
  do j = j_start, j_end, j_step
    do i = i_start, i_end, i_step
      num = num + 1
      ! 支持任意维度映射
      ijk = 1 + (i-1)*dim_x + (j-1)*dim_y + (k-1)*dim_z
      field(ijk) = temparray(num)
    enddo
  enddo
enddo
```

## 4. 代码解析

```fortran
subroutine pbsrhl(field, hhalo)
  use arrays, only : io,jo,ko
  use exchange
  use global, only : lower,upper,nijk,mout

  implicit none

  integer :: i,j,k,ijk,halo,num,idir,ixch
  integer :: IDSK,JDSK,KDSK,HHALO
  real :: field(lower:upper), temparray(nijk)

  tag = 100

  ! 多层 Halo 通信
  do halo = 1, hhalo
    ! 两个阶段：内部→外部，外部→内部
    do idir = 0, 6
      ! 发送阶段
      do ixch = 1, nexchs
        if (domxch(15,ixch,halo) == idir .and. domxch(1,ixch,halo) == mydom) then
          ! 提取数据并发送
          call mpi_bsend(...)
        endif
      enddo

      ! 接收阶段
      do ixch = 1, nexchs
        if (domxch(15,ixch,halo) == idir .and. domxch(2,ixch,halo) == mydom) then
          ! 接收数据并填充
          call mpi_recv(...)
        endif
      enddo
    enddo
  enddo
end subroutine pbsrhl
```

## 5. 关键变量

### 5.1 通信配置 (exchange 模块)

| 变量 | 含义 |
|------|------|
| `nexchs` | 通信任务总数 |
| `domxch(1,ixch,halo)` | 发送方域ID |
| `domxch(2,ixch,halo)` | 接收方域ID |
| `domxch(3:4,ixch,halo)` | i 方向起止索引 |
| `domxch(5:6,ixch,halo)` | j 方向起止索引 |
| `domxch(7:8,ixch,halo)` | k 方向起止索引 |
| `domxch(15,ixch,halo)` | 通信阶段标识 (0=内部,1=外部) |
| `domxch(16:18,ixch,halo)` | 接收域维度映射 |

### 5.2 MPI 变量

| 变量 | 含义 |
|------|------|
| `tid()` | 进程 rank 数组 |
| `tag` | 消息标签 |
| `mpi_comm_world` | MPI 通信域 |
| `info` | MPI 信息对象 |

## 6. 使用场景

`pbsrhl` 在以下位置被调用：

| 调用位置 | 目的 |
|----------|------|
| `moment.F90` | 随机场统计计算后同步 |
| `statistics.F90` | 统计量计算后同步 |
| `condif.F90` | 求解器系数构建后同步 |
| 其他需要边界数据的地方 | 确保求解器使用最新的边界值 |

## 7. 并行策略

### 7.1 域分解

```
        ┌─────────┬─────────┐
        │ Domain 0│ Domain 1│
        ├─────────┼─────────┤
        │ Domain 2│ Domain 3│
        └─────────┴─────────┘
        
        Ghost 区域环绕每个域
```

### 7.2 通信顺序

1. **非阻塞发送**：使用 `MPI_BSEND` 缓冲发送
2. **阻塞接收**：使用 `MPI_RECV` 等待数据
3. **双向通信**：同一阶段内同时发送和接收

## 8. 注意事项

1. **Halo 层数**：`hhalo` 参数控制通信的层数（通常为 1 或 2）
2. **维度映射**：支持发送域和接收域不同维度的情况
3. **消息标签**：统一使用 `tag=100`，MPI 自动区分不同消息
4. **性能**：通信与计算重叠是优化方向

## 9. 相关文件

| 文件 | 关系 |
|------|------|
| `module_exchange.F90` | 通信配置数据结构 |
| `pexch.F90` | 并行 exchange 设置 |
| `pbconf.F90` | 并行配置 |
| `pbsrhl.F90` | 本文件，通信实现 |

