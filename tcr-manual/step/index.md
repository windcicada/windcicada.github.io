# step

# step.F90 - 时间步进子程序

## 1. 程序概述

`step` 子程序负责**时间离散**，将方程中的时间导数项加入离散系数矩阵。它是 SIMPLE 算法中时间推进的关键步骤。

## 2. 调用关系

```
boffin.F90 (主循环)
    └── step(rho)  ← 在动量方程求解前调用
```

## 3. 算法说明

### 3.1 时间离散格式

程序使用**一阶隐式 Euler 格式**：

$$\frac{\rho^{n+1} - \rho^n}{\Delta t} + \text{div}(\rho \mathbf{u})^n = 0$$

其中隐式部分体现在系数矩阵的时间项处理。

### 3.2 两种求解模式

| 模式 | 条件 | 处理方式 |
|------|------|----------|
| 压力修正模式 | `nv == nvdp` | 只更新右端项 `bpc` |
| 变量求解模式 | 其他 | 更新系数矩阵和对角项 |

### 3.3 系数更新公式

对角系数更新：
$$\text{coef}(pc,ijk) = \text{coef}(pc,ijk) + \frac{\rho(ijk)}{\Delta t}$$

右端项更新：
$$\text{coef}(bpc,ijk) = \text{coef}(bpc,ijk) + \frac{\rho(ijk)}{\Delta t} \cdot \text{old\_value}$$

## 4. 代码解析

```fortran
subroutine step(rho)
  use arrays, only : jo,ko,nfo,coef,fold,drhodt
  use global
  use sgs_pdf
  
  INTEGER :: i,j,k,jk,ijk,ijkp
  real :: rdt,rho(lower:upper)
  
  ! 判断求解类型
  if (nv == nvdp) then
    ! 压力修正模式：只更新右端项（减去 drhodt）
    do k=2,n
      do j=2,m
        jk = jo(j)+ko(k)
        do i=2,l
          ijk = i+jk
          coef(bpc,ijk) = coef(bpc,ijk) - drhodt(ijk)
        enddo
      enddo
    enddo
  else
    ! 变量求解模式：更新系数矩阵
    do k=2,n
      do j=2,m
        jk = jo(j)+ko(k)
        do i=2,l
          ijk = i+jk
          ijkp = ijk + nfo(nv)  ! 旧时刻值索引
          rdt = rho(ijk) / dtim  ! 1/Δt × ρ
          
          ! 更新对角系数
          coef(pc,ijk) = coef(pc,ijk) + rdt
          
          ! 更新右端项
          coef(bpc,ijk) = coef(bpc,ijk) + rdt * fold(ijkp)
        enddo
      enddo
    enddo
  endif
end subroutine step
```

## 5. 关键变量

| 变量 | 含义 | 类型 |
|------|------|------|
| `dtim` | 时间步长 Δt | 全局变量 |
| `rho` | 密度数组 | 输入参数 |
| `fold` | 旧时刻变量值 | 全局数组 |
| `drhodt` | 密度时间导数 | 全局数组 |
| `nfo` | 场变量偏移数组 | 全局数组 |
| `coef` | 系数矩阵数组 | 全局数组 |
| `nv` | 当前求解变量索引 | 全局变量 |
| `nvdp` | 压力修正变量索引 | 全局变量 |

## 6. 并行通信

```fortran
! step 本身不直接调用通信，但依赖外部同步
! 通信在调用前/后通过 pbsrhl 完成
```

## 7. 注意事项

1. **网格范围**：循环从 2 到 n/m/l，避开边界（边界在 bndry* 中处理）
2. **隐式处理**：时间项加入对角系数保证稳定性
3. **旧值使用**：`fold(ijkp)` 存储上一时间步的变量值
4. **压力修正**：`nv == nvdp` 时跳过系数矩阵更新，只修正右端项

## 8. 相关文件

| 文件 | 关系 |
|------|------|
| `boffin.F90` | 调用 step 的主程序 |
| `update.F90` | 更新变量值 |
| `cgsol.F90` / `cgstab.F90` | 求解离散方程 |

