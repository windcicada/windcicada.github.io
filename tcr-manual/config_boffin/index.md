# config boffin

# config_boffin.F90

## 功能概述
**配置与初始化主程序**。负责读取输入参数、分配内存、初始化 MPI 并行环境、设置网格和物理模型参数。

## 程序结构

### 1. MPI 初始化
```fortran
call mpi_init(ierr)
call mpi_comm_size(mpi_comm_world, nsize, ierr)
```

### 2. 输入文件读取 (input.d)
- `load_bal`：负载均衡开关
- `geodir, resdir, statdir`：目录路径
- `fuel`：燃料类型
- `reaction_mechanism`：反应机理
- `pdf`：PDF 方法开关
- `nfield`：随机场数量
- `species_output`：物种输出格式

### 3. 网格信息读取
```fortran
open grid_vv.{mydom}
read imax, jmax, kmax
imax = imax + 2  ! ghost cells
```

### 4. 内存分配
```fortran
lower = -imax*jmax-imax
upper = lower + nijk - 1
allocate(...)  ! 各种数组
```

### 5. MPI 通信配置
```fortran
call pbconf  ! 注册 MPI 通信模式
```

## TCR 模型标志
```fortran
pasr = .false.      ! 是否使用 PaSR
pdf_kappa = .false. ! TCR kappa 计算开关
```

## 输出
生成 `config.out` 文件记录配置信息。

## 依赖模块
- `arrays`
- `chemistry`
- `digital_turbulence`
- `exchange`
- `global`
- `sgs_pdf`

