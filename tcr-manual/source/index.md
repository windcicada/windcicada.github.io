# source

# source.F90 - 焓方程源项子程序

## 1. 程序概述

`source` 子程序处理焓方程中的**源项**，主要涉及可压缩流动中压力功项。

## 2. 调用关系

```
boffin.F90 (主循环)
    └── source()  ← 在焓方程求解时调用
```

## 3. 功能说明

### 3.1 源项类型

| 条件 | 源项 |
|------|------|
| `nv == nvh` 且 `compressible` | 压力功项 `dp/dt` |
| 其他 | 无 |

### 3.2 物理意义

对于可压缩流动，焓方程包含压力功项：

$$\frac{\partial (\rho h)}{\partial t} + \dots = \frac{\partial p}{\partial t}$$

该项在 `dpdt` 数组中计算，并在求解焓方程时添加到右端项。

## 4. 代码解析

```fortran
subroutine source
  use arrays, only : jo, ko, coef, dpdt
  use global
  use chemistry
  use sgs_pdf

  implicit none
  integer :: i, j, k, jk, ijk

  ! 仅在焓方程且可压缩时添加源项
  if (nv == nvh .and. compressible) then
    do k = 2, n
      do j = 2, m
        jk = jo(j) + ko(k)
        do i = 2, l
          ijk = i + jk
          ! 添加压力时间导数源项
          coef(bpc, ijk) = coef(bpc, ijk) + dpdt(ijk)
        enddo
      enddo
    enddo
  endif
end subroutine source
```

## 5. 关键变量

| 变量 | 含义 | 类型 |
|------|------|------|
| `nv` | 当前求解变量索引 | 全局 |
| `nvh` | 焓变量索引 | 全局 |
| `compressible` | 可压缩标志 | 全局 |
| `dpdt` | 压力时间导数 | 数组 |
| `coef(bpc,ijk)` | 右端项 | 数组 |

## 6. 物理背景

### 6.1 焓方程

完整能量方程（以比焓 $h$ 表示）：

$$\frac{\partial \rho h}{\partial t} + \nabla \cdot (\rho \mathbf{u} h) = \nabla \cdot (\Gamma \nabla h) + S_h$$

其中源项包括：
- 粘性耗散
- 辐射换热
- **压力功项**（此处处理）

### 6.2 压力功项

$$\frac{Dp}{Dt} = \frac{\partial p}{\partial t} + \mathbf{u} \cdot \nabla p$$

在时间离散中，压力时间导数 $\partial p/\partial t$ 被显式处理。

## 7. 注意事项

1. **仅内点**：循环从 2 到 l/m/n，避开边界
2. **可压缩限制**：仅在 `compressible = .true.` 时生效
3. **焓变量**：仅在求解焓方程时调用

## 8. 相关文件

| 文件 | 关系 |
|------|------|
| `compress.F90` | 计算 dpdt |
| `condif.F90` | 构建对流扩散系数 |
| `boffin.F90` | 调用 source 的主程序 |

