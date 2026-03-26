# start pdf

# start_pdf.F90 - 随机场 PDF 初始化子程序

## 1. 程序概述

`start_pdf` 子程序负责初始化**随机场 PDF 方法**的场数据，包括边界条件和初始条件。

## 2. 调用关系

```
start_init.F90 / start_read.F90 (初始化阶段)
    └── start_pdf()  ← PDF 求解器初始化
```

## 3. 功能说明

### 3.1 主要功能

| 功能 | 描述 |
|------|------|
| 边界初始化 | 设置所有随机场的边界值 |
| 重启读取 | 从 restart_pdf 文件读取随机场数据 |
| 初始条件 | 初始化随机场值为 finit |
| 热力学状态 | 从初始场计算温度和密度 |

### 3.2 随机场存储

随机场数据存储在主数组 `f` 中：

```
f(nf + ifld*nsc + isp)  ! ifld=1~nfield, isp=1~nsc
```

## 4. 代码解析

```fortran
subroutine start_pdf
  use arrays
  use chemistry
  use exchange
  use extras
  use global
  use sgs_pdf

  implicit none
  character(len=12) :: name
  integer :: ia, ie, i, j, k, nsp0, nv0, nfld, jo2, jn2
  real :: yo2, yn2
  real(kind=4), pointer :: u(:), v(:), w(:)

  ! 指针关联
  u => assign_pointer(f(lower+nfo(nvu)), lower, upper)
  v => assign_pointer(f(lower+nfo(nvv)), lower, upper)
  w => assign_pointer(f(lower+nfo(nvw)), lower, upper)

  ! ========== 1. 边界值初始化 ==========
  do isp = 1, nsc
    nv0 = nf + nsc + isp  ! 平均场索引
    do ifld = 0, nfield
      nv = nf + ifld * nsc + isp  ! 随机场索引
      ! 设置所有边界面的值
      do j = 1, mp1
        do k = 1, np1
          fsth(nv, j, k) = fsth(nv0, j, k)
          fnth(nv, j, k) = fnth(nv0, j, k)
        enddo
        do i = 1, lp1
          flft(nv, i, j) = flft(nv0, i, j)
          frht(nv, i, j) = frht(nv0, i, j)
        enddo
      enddo
      do i = 1, lp1
        do k = 1, np1
          fwst(nv, k, i) = fwst(nv0, k, i)
          fest(nv, k, i) = fest(nv0, k, i)
        enddo
      enddo
    enddo
  enddo

  ! ========== 2. 重启读取模式 ==========
  if (read_pdf) then
    ia = nfo(nf+1) + lower
    ie = nfo(nf + nfield * nsc + nsc) + upper
    f(ia:ie) = 0.0

    write(resfile, '(2a,i3.3)') trim(path), '/Restart/restart_pdf.', mydom
    open(nin, file=resfile, status='old', form='unformatted', err=8000)
    read(nin) nfld, nsp0

    ! 读取随机场数据
    ! ... (详细的读取逻辑)
    close(nin)
  else
    ! ========== 3. 初始条件 ==========
    ! 初始化所有随机场
    do isp = 1, nsc
      nv0 = nf + nsc + isp
      do ifld = 1, nfield
        nv = nf + ifld * nsc + isp
        ia = nfo(nv) + lower
        ie = nfo(nv) + upper
        f(ia:ie) = finit(nv0)
      enddo
    enddo

    ! 应用边界条件
    do isp = 1, nsc
      do ifld = 1, nfield
        nv = nf + ifld * nsc + isp
        call bndry3(u, v, w)
      enddo
    enddo

    ! ========== 4. 计算初始热力学状态 ==========
    ifld = 1
    do isp = 1, nsp
      nv = nf + ifld * nsc + isp
      yn(isp) = finit(nv)
    enddo
    nv = nf + ifld * nsc + nsc
    enth = finit(nv)

    call temperature(enth, pressr, yn, theta, den, ifail)
    rho(:) = sngl(den)
    temp(:) = sngl(theta)

    ! 设置所有随机场的温度和密度
    do ifld = 1, nfield
      field_temperature(ifld, lower:upper) = sngl(theta)
      field_density(ifld, lower:upper) = sngl(den)
    enddo
  endif

end subroutine start_pdf
```

## 5. 关键变量

### 5.1 随机场参数

| 变量 | 含义 |
|------|------|
| `nfield` | 随机场数量 |
| `nsc` | 标量数量（混合分数+焓） |
| `nsp` | 物种数量 |
| `nf` | 常规变量数 |

### 5.2 边界数组

| 数组 | 含义 |
|------|------|
| `fsth(nv, j, k)` | 南边界 (Y-) |
| `fnth(nv, j, k)` | 北边界 (Y+) |
| `fwst(nv, k, i)` | 西边界 (X-) |
| `fest(nv, k, i)` | 东边界 (X+) |
| `flft(nv, i, j)` | 左边界 (Z-) |
| `frht(nv, i, j)` | 右边界 (Z+) |

### 5.3 辅助数组

| 数组 | 含义 |
|------|------|
| `field_temperature(ifld, ijk)` | 随机场温度 |
| `field_density(ifld, ijk)` | 随机场密度 |

## 6. 物理说明

### 6.1 随机场方法

PDF 方法使用多个随机实现（随机场）来统计平均：

$$Z(\mathbf{x}, t) = \frac{1}{N_f} \sum_{i=1}^{N_f} \phi_i(\mathbf{x}, t)$$

### 6.2 初始化策略

1. 所有随机场初始化为相同值（平均场）
2. 在求解过程中随机扰动逐渐发展
3. 温度和密度从初始物种场计算

## 7. 相关文件

| 文件 | 关系 |
|------|------|
| `fieldpdf.F90` | PDF 方程求解 |
| `start_pdf.F90` | PDF 初始化 |
| `start_read.F90` | 调用 start_pdf 的重启入口 |
| `temperature.F90` | 温度计算 |

