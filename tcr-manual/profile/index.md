# profile

# profile.F90 - 数字湍流入口数据读取子程序

## 1. 程序概述

`profile` 子程序负责读取**数字湍流 (Digital Turbulence)** 入口边界数据，包括速度时间序列和空间分布。

## 2. 调用关系

```
digital_turbulence 模块
    └── profile(ip, i, iadd, m, jadd, n, kadd, io, jo, ko, imax, jmax, kmax)
        ← 在入口数据初始化时调用
```

## 3. 功能说明

### 3.1 数据读取

| 数据类型 | 文件 | 格式 |
|----------|------|------|
| 网格信息 | `digit_info_{ip}.d` | 文本 |
| U 速度 | `inflow_U_{ip}.d` | 二进制 |
| V 速度 | `inflow_V_{ip}.d` | 二进制 |
| W 速度 | `inflow_W_{ip}.d` | 二进制 |

### 3.2 插值方法

使用**双线性插值**将入口数据映射到计算网格：

$$u_{interp} = c_2 c_1 u_{jc,kc} + c_2 (1-c_1) u_{jc-1,kc} + c_1 (1-c_2) u_{jc,kc-1} + (1-c_1)(1-c_2) u_{jc-1,kc-1}$$

## 4. 代码解析

```fortran
subroutine profile(ip, i, iadd, m, jadd, n, kadd, io, jo, ko, imax, jmax, kmax)
  use global, only : nvu, nvv, nvw, infile, mout, scrn, lin, path
  use digital_turbulence, only : inflowdata, indy, indz, u_turb, &
                                 Y_digit, z_digit, Ntsteps, mt, Lt, &
                                 Convection_velocity, inflow
  use arrays, only : x, y, z
  use exchange, only : master
  use extras

  implicit none
  integer :: i, j, k, ijk, ijks, ip, imax, jmax, kmax, m, n
  integer :: jc, kc, nt, nv
  integer :: io(0:imax), jo(0:jmax), ko(0:kmax)
  integer :: iadd, jadd, kadd
  real :: c1, c2, uturb(3)

  ! ========== 1. 读取网格信息 ==========
  write(infile, '(2a,i1.1,1a)') trim(path), '/digit_inflow/digit_info_', ip, '.d'
  open(unit=lin, file=infile, status='old')

  read(lin,*) indy, indz, Ntsteps(ip), mt, Lt(ip), Convection_velocity(ip)
  
  if (master) then
    write(scrn, *) inflow(ip), 'boundary : average velocity=', Convection_velocity(ip)
  endif

  ! 分配数组
  inflowdata = 0.0
  allocate(u_turb(3, 1:indy, 1:indz))
  allocate(y_digit(1:indy), z_digit(1:indz))

  ! 读取 y, z 坐标
  do j = 1, indy
    read(lin, *) y_digit(j)
  enddo

  do k = 1, indz
    read(lin, *) z_digit(k)
  enddo

  close(lin)

  ! ========== 2. 打开速度数据文件 ==========
  write(infile, '(2a,i1.1,a)') trim(path), '/digit_inflow/inflow_U_', ip, '.d'
  open(46, file=infile, form='unformatted')
  ! ... V, W 文件类似 ...

  ! ========== 3. 读取时间序列并进行插值 ==========
  do nt = 1, Ntsteps(ip)
    read(46) ((u_turb(nvu, j, k), j=1, indy), k=1, indz)
    read(47) ((u_turb(nvv, j, k), j=1, indy), k=1, indz)
    read(48) ((u_turb(nvw, j, k), j=1, indy), k=1, indz)

    ! 双线性插值
    do j = 2, m
      do k = 2, n
        call normal(...)  ! 计算插值系数 c1, c2
        
        ! ... 插值计算 ...
        
        ! 根据边界方向赋值
        if (abs(nx) >= 1.0) then
          inflowdata(ip, nt, nvu, j, k) = uturb(1) * real(sign(1, iadd))
        ! ...
        endif
      enddo
    enddo
  enddo

  close(46)
  close(47)
  close(48)

  deallocate(u_turb)
  deallocate(y_digit, z_digit)

end subroutine profile
```

## 5. 关键变量

### 5.1 输入参数

| 参数 | 含义 |
|------|------|
| `ip` | 入口面编号 (1-4) |
| `i, j, k` | 网格索引 |
| `iadd, jadd, kadd` | 方向偏移 |
| `io, jo, ko` | 网格偏移数组 |
| `imax, jmax, kmax` | 网格尺寸 |

### 5.2 内部变量

| 变量 | 含义 |
|------|------|
| `indy, indz` | 入口数据网格尺寸 |
| `Ntsteps(ip)` | 时间步数 |
| `Lt(ip)` | 对流时间长度 |
| `Convection_velocity(ip)` | 对流速度 |
| `c1, c2` | 插值系数 |

### 5.3 输出数组

| 变量 | 维度 | 含义 |
|------|------|------|
| `inflowdata(ip, nt, nv, j, k)` | 5D | 入口速度数据 |

## 6. 插值坐标计算

通过 `normal` 子程序确定插值位置：

- **c1**: 在 y 方向的相对位置
- **c2**: 在 z 方向的相对位置

```fortran
c1 = (x(ijks) - y_digit(jc-1)) / (y_digit(jc) - y_digit(jc-1))
c2 = (x(ijks) - z_digit(kc-1)) / (z_digit(kc) - z_digit(kc-1))
```

## 7. 物理背景

### 7.1 数字湍流方法

数字湍流 (Digital Turbulence) 是一种入口湍流生成方法：
1. 通过 DNS/LES 预计算得到湍流数据
2. 在入口边界注入时序速度数据
3. 保持湍流结构的时空相关性

### 7.2 对流时间

$$t_{convection} = \frac{L_t}{U_{convection}}$$

确保入口数据覆盖足够的对流时间尺度。

## 8. 注意事项

1. **边界方向**：根据法向 `nx, ny, nz` 确定入口面
2. **索引范围**：循环从 2 开始，避开第一层边界
3. **内存管理**：使用后释放临时数组

## 9. 相关文件

| 文件 | 关系 |
|------|------|
| `normal.F90` | 坐标计算子程序 |
| `module_digital_turbulence.F90` | 数字湍流模块 |
| `openinflow.F90` | 入口边界处理 |
| `start_init.F90` | 初始化入口数据 |

