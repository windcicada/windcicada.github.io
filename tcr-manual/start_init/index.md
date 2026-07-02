# start init

# start_init.F90 - 求解器初始化子程序

## 1. 程序概述

`start_init` 子程序负责在**首次运行**时初始化求解器的关键变量和场数据。

## 2. 调用关系

```
boffin.F90 (启动阶段)
    └── start_init()  ← 仅在非重启模式时调用
```

## 3. 功能说明

### 3.1 初始化内容

| 项目 | 初始化值 |
|------|----------|
| 迭代步数 | `istep = 0` |
| 分子粘度 | `visc(:) = visco` |
| SGS 模型常数 | `cs(:) = cs0` (或 `2.5*cs0²` for Vreman) |
| 流场变量 | `f = finit` (从 input 读取的初值) |
| 旧时间步 | `fold = f` |
| 统计计数器 | `statsp = 0` |

## 4. 代码解析

```fortran
subroutine start_init
  use arrays
  use chemistry
  use exchange
  use global
  use sgs_pdf

  implicit none
  integer :: i, j, k, ijk, ijkp

  ! ========== 1. 初始化迭代步数 ==========
  istep = 0

  ! ========== 2. 初始化粘度 ==========
  visc(:) = visco  ! 分子粘度 (用户指定默认值)

  ! ========== 3. 初始化 SGS 模型常数 ==========
  if (sgs_viscosity == 'vreman') then
    cs(:) = 2.5 * cs0**2  ! Vreman 模型特殊处理
  else
    cs(:) = cs0  ! 标准 Smagorinsky/Dynamic 模型
  endif

  ! ========== 4. 初始化流场变量 (U, V, W) ==========
  do nv = 1, 3  ! 速度分量
    do k = 0, np2
      do j = 0, mp2
        do i = 0, lp2
          ijk = i + jo(j) + ko(k)
          ijkp = ijk + nfo(nv)  ! 变量偏移
          f(ijkp) = finit(nv)  ! 从 input 读取的初值
        enddo
      enddo
    enddo
  enddo

  ! ========== 5. 保存旧时间步数据 ==========
  fold(:) = f(:)

  ! ========== 6. 初始化统计计数器 ==========
  statsp = 0

end subroutine start_init
```

## 5. 关键变量

### 5.1 输入参数

| 变量 | 含义 | 来源 |
|------|------|------|
| `visco` | 默认分子粘度 | input 配置文件 |
| `cs0` | 默认 SGS 模型常数 | input 配置文件 |
| `finit(nv)` | 变量初始值数组 | input 配置文件 |

### 5.2 输出变量

| 变量 | 含义 | 状态 |
|------|------|------|
| `istep` | 当前迭代步 | 初始化为 0 |
| `visc` | 分子粘度数组 | 初始化 |
| `cs` | SGS 模型常数数组 | 初始化 |
| `f` | 所有流场变量 | 初始化 |
| `fold` | 上一时间步变量 | 初始化为当前值 |
| `statsp` | 统计采样计数器 | 初始化为 0 |

## 6. SGS 模型初始化差异

| 模型 | C_s 初始化 |
|------|-----------|
| Smagorinsky | `cs = cs0` |
| Dynamic | `cs = cs0` (运行时动态计算) |
| Vreman | `cs = 2.5 * cs0²` |

## 7. 注意事项

1. **仅初始化速度**：只初始化前 3 个变量 (U, V, W)，其他变量通过 input 或 restart 读取
2. **网格范围**：覆盖整个网格 (0 到 lp2/mp2/np2)，包括边界
3. **fold 初始化**：确保时间推进时有初始值可用
4. **与 start_read 对比**：重启运行时使用 `start_read` 而非 `start_init`

## 8. 相关文件

| 文件 | 关系 |
|------|------|
| `input.F90` | 读取控制参数 |
| `start_read.F90` | 重启模式初始化 |
| `boffin.F90` | 调用 start_init 的主程序 |

