# start probe

# start_probe.F90 - 探针初始化子程序

## 1. 程序概述

`start_probe` 子程序负责初始化**探针监测点**，包括读取探针位置、确定所属域、分配输出文件。

## 2. 调用关系

```
start_init.F90 / start_read.F90 (初始化阶段)
    └── start_probe()  ← 探针初始化
```

## 3. 功能说明

### 3.1 主要功能

1. **读取配置**：从 `probe.d` 文件读取探针参数
2. **定位探针**：确定每个探针所在的网格单元和 MPI 域
3. **分配文件**：为每个探针分配输出文件单元
4. **MPI 同步**：确保所有进程知道探针的域分布

### 3.2 探针配置 (probe.d)

```
pressure_probe  probe_step
n_probe
read_probes
x1 y1 z1  (探针1位置)
x2 y2 z2  (探针2位置)
...
```

## 4. 代码解析

```fortran
subroutine start_probe
  use arrays, only : io, jo, ko, x_probe, y_probe, z_probe, &
                    cell_probe, dom_probe
  use global, only : l, m, n, mout, nin, nout, outfile, pout, path, &
                    nvu, nvv, nvw, scrn, infile, n_probe, pressure_probe, probe_step

  use exchange
  use extras

  implicit none
  integer :: i, j, k, i0, j0, k0, ijk, i1
  logical :: inside_cell, read_probes

  ! ========== 1. 读取探针配置 ==========
  write(infile, '(2a)') trim(path), '/probe.d'
  open(nin, file=infile, status='old')

  read(nin, *)
  read(nin, *)
  read(nin, *)
  read(nin, *) pressure_probe, probe_step

  if (pressure_probe) then
    read(nin, *)
    read(nin, *) n_probe  ! 探针数量
    read(nin, *)
    read(nin, *) read_probes  ! 是否读取历史数据
    read(nin, *)
    allocate(x_probe(n_probe), y_probe(n_probe), z_probe(n_probe))
    allocate(pout(n_probe))
    allocate(cell_probe(n_probe), dom_probe(n_probe))

    do i1 = 1, n_probe
      read(nin, *) x_probe(i1), y_probe(i1), z_probe(i1)  ! 探针位置
    enddo
    close(nin)
  else
    close(nin)
    return
  endif

  ! ========== 2. 定位探针所在单元 ==========
  dom_probe(:) = -1

  do i1 = 1, n_probe
    inside_cell = .false.
    do k = 2, n
      do j = 2, m
        do i = 2, l
          if (.not. inside_cell) then
            call locate(i, j, k, x_probe(i1), y_probe(i1), z_probe(i1), &
                        inside_cell, i0, j0, k0)
            if (inside_cell) then
              dom_probe(i1) = mydom
              ijk = 1 + io(i0) + jo(j0) + ko(k0)
              cell_probe(i1) = ijk
            endif
          endif
        enddo
      enddo
    enddo
  enddo

  ! ========== 3. MPI 同步域信息 ==========
  call mpi_allreduce(mpi_in_place, dom_probe, n_probe, &
                     mpi_integer, mpi_max, &
                     mpi_comm_world, info)

  ! ========== 4. 分配输出文件 ==========
  do i1 = 1, n_probe
    if (master .and. dom_probe(i1) == -1) then
      write(scrn, '(a,i2.2,a)') 'probe_', i1, ' not found'
      write(scrn, *) 'x=', x_probe(i1), 'y=', y_probe(i1), 'z=', z_probe(i1)
      call boffin_stop(__FILE__, __LINE__)
    endif

    if (dom_probe(i1) == mydom) then
      write(outfile, '(2a,i2.2)') trim(path), 'Probes/probe-', i1
      write(mout, *) outfile
      pout(i1) = i1 + 50

      if (read_probes) then
        open(pout(i1), file=outfile, form='formatted', status='old', access='append')
      else
        open(pout(i1), file=outfile, form='formatted', status='unknown')
      endif
    endif
  enddo

  ! ========== 5. 写入探针列表 ==========
  write(outfile, '(2a)') trim(path), 'Probes/probe'
  open(nout, file=outfile, form='formatted', status='unknown')
  do i = 1, n_probe
    write(nout, '(a,i2.2,x,1p,3(a,e10.3))') 'Probe No=', i, &
                 'x=', x_probe(i), ' y=', y_probe(i), ' z=', z_probe(i)
  enddo
  close(nout)

end subroutine start_probe
```

## 5. 关键变量

### 5.1 输入参数

| 变量 | 含义 |
|------|------|
| `pressure_probe` | 是否启用探针 |
| `probe_step` | 探针输出频率 |
| `n_probe` | 探针数量 |
| `read_probes` | 是否读取历史 |

### 5.2 输出变量

| 数组 | 含义 |
|------|------|
| `x_probe(i), y_probe(i), z_probe(i)` | 探针位置 |
| `cell_probe(i)` | 探针所在单元索引 |
| `dom_probe(i)` | 探针所属 MPI 域 |
| `pout(i)` | 探针输出文件单元 |

## 6. 相关文件

| 文件 | 关系 |
|------|------|
| `probe.F90` | 探针输出 |
| `locate.F90` | 单元定位 |
| `output.F90` | 总体输出 |

