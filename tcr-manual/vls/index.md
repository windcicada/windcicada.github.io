# vls

# vls.F90 - 变梯度限制器子程序

## 1. 程序概述

`vls` (Variable Limit Scheme) 子程序实现**变梯度限制器**（又称 VLS 格式），用于在迎风离散格式中根据梯度调整扩散系数，防止数值振荡。

## 2. 调用关系

```
condif.F90 (对流-扩散离散)
    └── vls(...)  ← 在构建通量时调用
```

## 3. 功能说明

### 3.1 物理背景

在有限体积法中，当流场中存在**激波**或**大梯度**时，标准迎风格式可能产生数值振荡。VLS 格式通过检测梯度方向来调整数值扩散：

$$\Gamma_{VLS} = \begin{cases} (1-w) \cdot \frac{|G|}{b_{11}} \cdot \phi(r_+) & G > 0 \\ w \cdot \frac{|G|}{b_{11}} \cdot \phi(r_-) & G < 0 \end{cases}$$

其中 $\phi(r)$ 是限制器函数。

### 3.2 Venkatakrishnan 限制器

程序使用 Venkatakrishnan 限制器：

$$\phi(r) = \frac{r^2 + 2r}{r^2 + r + 2}$$

或等效形式：

$$\phi(r) = 1.0 - \max(0, \min(2r, 1))$$

## 4. 代码解析

```fortran
subroutine vls(f, b11, j, k, gi, ibs, ibn, l, w1, imax, io, jmax, jo, kmax, ko, gam)
  use global, only : lower, upper, mout, uround, small
  use arrays, only : ajc, x, y, z

  implicit none
  integer, intent(in) :: j, k, l, imax, jmax, kmax
  integer, intent(in) :: io(0:imax), jo(0:jmax), ko(0:kmax)
  integer, intent(in) :: ibs(jmax, kmax), ibn(jmax, kmax)
  
  real, intent(in) :: b11(lower:upper), gi(lower:upper), w1(lower:upper)
  real, intent(in) :: f(lower:upper)
  real, intent(inout) :: gam(imax)
  real :: ds, vsmall, ratio, vlim, dfds(imax)

  ! 限制器函数
  vlim(ratio) = 1.0 - max(0.0, min(2.0*ratio, 1.0))

  ! ========== 1. 确定计算范围 ==========
  jk = jo(j) + ko(k)

  ! 入口边界处理
  if (ibs(j, k) == -100) then
    istart = 1
  else
    istart = 2
    dfds(1) = 0.0
  endif

  ! 出口边界处理
  if (ibn(j, k) == -100) then
    iend = l + 2
  else
    iend = l + 1
    dfds(l + 2) = 0.0
  endif

  ! ========== 2. 计算梯度 ==========
  do i = istart, iend
    ijk = 1 + io(i) + jk
    ijks = ijk - io(2)
    ds = sqrt((x(ijk)-x(ijks))**2 + (y(ijk)-y(ijks))**2 + (z(ijk)-z(ijks))**2)
    dfds(i) = (f(ijk) - f(ijks)) / ds
  enddo

  ! ========== 3. 应用限制器调整扩散系数 ==========
  do i = 1, l
    ijk = 1 + io(i) + jk
    ijkn = ijk + io(2)
    
    if (gi(ijkn) * ajc(ijk) > 0.0) then
      ! 正向流动：使用上游梯度
      vsmall = max(small, uround * max(abs(dfds(i)), abs(dfds(i+1))))
      ratio = dfds(i) / (dfds(i+1) + sign(vsmall, dfds(i+1)))
      gam(i) = max(gam(i), &
          (1.0 - w1(ijk)) * abs(gi(ijkn)) / b11(ijk) * vlim(ratio))
    else
      ! 反向流动：使用下游梯度
      vsmall = max(small, uround * max(abs(dfds(i+2)), abs(dfds(i+1))))
      ratio = dfds(i+2) / (dfds(i+1) + sign(vsmall, dfds(i+1)))
      gam(i) = max(gam(i), &
          w1(ijk) * abs(gi(ijkn)) / b11(ijk) * vlim(ratio))
    endif
  enddo
end subroutine vls
```

## 5. 关键变量

### 5.1 输入参数

| 参数 | 含义 |
|------|------|
| `f` | 待离散变量 |
| `b11` | 对角系数 |
| `gi` | 质量通量 |
| `w1` | 网格权重 |
| `ibs/ibn` | 边界标记数组 |

### 5.2 输出参数

| 参数 | 含义 |
|------|------|
| `gam(imax)` | 调整后的扩散系数 |

### 5.3 内部变量

| 变量 | 含义 |
|------|------|
| `dfds` | 梯度数组 |
| `ratio` | 梯度比 r |
| `vlim` | 限制器函数值 |

## 6. 梯度限制器说明

### 6.1 梯度比定义

$$r = \frac{\nabla_{up}}{\nabla_{down}}$$

- $r > 1$: 梯度增强
- $r \in (0, 1)$: 梯度减弱
- $r < 0$: 极值点

### 6.2 限制器效果

| r 值 | 限制器输出 | 效果 |
|------|------------|------|
| 0 | 0 | 完全迎风 |
| 0.5 | 0.33 | 弱扩散 |
| 1 | 1 | 中心格式 |
| >1 | <1 | 抑制振荡 |

## 7. 物理背景

### 7.1 数值振荡抑制

在激波附近，变量梯度急剧变化，标准格式会产生伪振荡。VLS 格式通过：

1. **梯度检测**：计算相邻单元梯度
2. **限制器应用**：根据梯度比调整数值扩散
3. **自动切换**：在光滑区域使用中心格式，在大梯度区域恢复迎风

### 7.2 与 TVD 格式的关系

VLS 格式是 TVD (Total Variation Diminishing) 格式的一种实现，与 TVD 限制器本质相同。

## 8. 注意事项

1. **仅一维处理**：vls 沿 i 方向处理，需在 j,k 循环中调用
2. **边界处理**：-100 标记表示周期性或特殊边界
3. **避免除零**：使用 `vsmall` 防止梯度为零时除零错误

## 9. 相关文件

| 文件 | 关系 |
|------|------|
| `condif.F90` | 调用 vls 的父程序 |
| `gam_tvd.F90` | TVD 格式系数计算 |
| `gradient.F90` | 梯度计算 |

