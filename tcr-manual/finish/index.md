# finish

# finish.F90

## 功能概述
程序结束子程序。执行清理工作、写入重启文件和统计文件、关闭 MPI 通信。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `finish` | 结束处理 |

## 主要功能

### 1. 保存重启文件
```fortran
if (write_restart) then
    write(nout) istep, tim, dtim
    write(nout) f(:)    ! 所有变量
    write(nout) p(:)    ! 压力
    if (sgs_model == 'dyn_stress_piomelli') then
        write(nout) cs(:)  ! 动态模型系数
    endif
```

### 2. 保存统计文件
```fortran
if (turbstat) then
    write(nout) atime      ! 平均时间
    write(nout) fstat(:)   ! 湍流统计
    write(nout) ftau(:)    ! 雷诺应力
    write(nout) fschem(:)  ! 化学统计
    write(nout) phase_average(:,:)  ! 相平均
```

### 3. 关闭 MPI
```fortran
call mpi_finalize(info)
```

## 依赖模块
- `arrays`：流场数组 f、压力 p
- `chemistry`
- `digital_turbulence`
- `exchange`：MPI 通信
- `global`：控制参数
- `sgs_pdf`：SGS 模型参数

