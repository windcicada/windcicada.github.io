# init random seed

# init_random_seed.F90 - Random Seed Initialization

## 概述

`init_random_seed` 子程序初始化 Fortran 内置伪随机数生成器（PRNG），确保每次运行产生不同的随机序列。

## 算法原理

### 优先方案：系统随机源

```fortran
open(newunit=un, file="/dev/urandom", ...)
read(un) seed
```

读取 Linux/Unix 系统的 `/dev/urandom` 获取高质量随机种子。

### 备选方案：时间+进程ID

当系统随机源不可用时（如 Windows），使用：

```fortran
! 时间戳
call system_clock(t)
call date_and_time(values=dt)
t = (dt(1)-1970)*365*24*60*60*1000 + ...  ! 毫秒级时间

! 进程ID
pid = getpid()
t = ieor(t, int(pid, kind(t)))

! 线性同余生成器 (LCG)
do i = 1, n
  seed(i) = lcg(t)
end do
```

### LCG 种子生成

```fortran
s = mod(s * 279470273, 4294967291)
lcg = mod(s, huge(0))
```

## 输入参数

- `n` - 所需种子数组大小

## 输出

- `seed` - 随机种子数组
- 调用 `random_seed(put=seed)` 初始化 PRNG

## 兼容性

- **Linux/Unix**: 使用 `/dev/urandom`
- **Windows**: 使用时间戳 + 进程ID
- **Intel 编译器**: 使用 `ifport::getpid` 获取进程ID

