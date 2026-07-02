# start phase averaging

# start_phase_averaging.F90 - 相平均初始化子程序

## 1. 程序概述

`start_phase_averaging` 子程序负责初始化**相平均** (Phase Averaging) 统计的数组和时间。

## 2. 调用关系

```
start_init.F90 / start_read.F90 (初始化阶段)
    └── start_phase_averaging()  ← 相平均初始化
```

## 3. 功能说明

### 3.1 相平均概念

相平均是周期性湍流（如火焰颤振、旋涡脱落）的统计方法：

$$\langle \phi \rangle_\phi = \frac{1}{N_p} \sum_{i=1}^{N_p} \phi(t_i)$$

### 3.2 初始化选项

| 模式 | 处理 |
|------|------|
| 新计算 | 设置均匀分布的时间点，清零统计数组 |
| 重启 | 从 restart.phase 文件读取历史数据 |

## 4. 代码解析

```fortran
Subroutine start_phase_averaging
  use arrays
  use exchange
  use global

  integer :: i

  if (restart_phase_averaging) then
    ! ========== 重启模式 ==========
    write(infile, '(2a,i3.3)') trim(path), 'Restart/restart.phase.', mydom
    open(nout, file=infile, status='unknown', form='unformatted')
    read(nout) phn(:)
    read(nout) phase_time(:)
    read(nout) phase_average(:,:)
    close(nout)

    if (master) then
      write(scrn, *) ' --- Restarting Phase averaging from previous solution --- '
    endif
  else
    ! ========== 新计算模式 ==========
    ! 时间点均匀分布
    do i = 1, phmax
      phase_time(i) = start_time + real(i-1) / (12.0 * frequency)
    enddo

    ! 初始化统计数组
    phn(:) = 0
    phase_average(:,:) = 0.0
  endif

end subroutine start_phase_averaging
```

## 5. 关键变量

### 5.1 相平均参数

| 变量 | 含义 |
|------|------|
| `phmax` | 相位点最大数量 |
| `frequency` | 周期性频率 |
| `restart_phase_averaging` | 重启标志 |

### 5.2 输出数组

| 数组 | 含义 |
|------|------|
| `phn(:)` | 每个相位的样本计数 |
| `phase_time(:)` | 相位时间点 |
| `phase_average(:,:)` | 相平均统计量 |

## 6. 相关文件

| 文件 | 关系 |
|------|------|
| `statistics.F90` | 相平均统计计算 |
| `phase_averaging` 模块 | 相平均功能模块 |

