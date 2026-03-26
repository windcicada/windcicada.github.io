# mixer

# mixer.F90 - TCR 小尺度混合模型

> **源文件**: `0.src.TCR.dyn728/mixer.F90`
> **功能**: 实现 TCR (Turbulent Combustion Research) 求解器中的小尺度混合模型

## 1. 程序概述

`mixer` 子程序实现 TCR 求解器中的**小尺度混合模型**，用于模拟湍流流动中标量（混合分数、组分）的湍流混合过程。该模型是 TCR 燃烧模型的核心组成部分，与 PDF 方法结合使用。

### 关键特性

- **模型类型**: TCR 混合模型（区别于传统 IEM 模型）
- **动态 C_φ**: 使用动态方法计算混合常数
- **组分分类**: 分别处理产物、反应物、自由基
- **隐式求解**: 将混合项添加到方程系数矩阵中

## 2. 算法说明

### 2.1 TCR 混合模型公式

TCR 混合模型的核心公式：

$$\beta = 0.5 \cdot f_{mixer} \cdot C_{\phi}$$

其中：

$$f_{mixer} = \frac{\Gamma_{SGS} + \nu}{\Delta_{TCR}^{2/3}}$$

- $\Gamma_{SGS} = gam\_sgs$ — 亚格子扩散系数
- $\nu = visc$ — 分子运动粘度
- $\Delta_{TCR}$ — 滤波器宽度（网格单元体积的 1/3 次方）

### 2.2 动态 C_φ 计算

根据组分类型，$C_{\phi}$ 采用不同的计算方式：

| 组分类别 | 条件 | 公式 |
|----------|------|------|
| **产物** (CO₂, H₂O, nsc) | `isp == nsc` 或名称匹配 | $C_{\phi} = \sqrt{c_{products} \cdot c_{radicals}}$ |
| **反应物** (O₂, 燃料) | `isp == jfuel` 或名称匹配 | $C_{\phi} = \sqrt{c_{reactants} \cdot c_{radicals}}$ |
| **自由基** (其他) | 默认 | $C_{\phi} = c_{radicals}$ |

**限制**: $1.0 \leq C_{\phi} \leq 10.0$

### 2.3 κ (kappa) 修正

混合模型中引入了 kappa（反应物体积分数）修正：

```fortran
kpab = kappa(isp,ijk)
kpab = min(1.00, kpab)
kpab = max(0.01, kpab)
```

该值来自 TCR 反应模型，表示局部反应程度。

## 3. 方程中的处理

### 3.1 隐式源项

混合项作为隐式源项添加到标量输运方程中：

```fortran
! 对角系数增加
coef(pc,ijk)  = coef(pc,ijk)  + beta
! 右端项增加
coef(bpc,ijk) = coef(bpc,ijk) + beta * fbar
```

其中 `fbar` 是滤波后的混合分数均值。

### 3.2 时间尺度输出

程序输出两种混合时间尺度用于后处理：

| 变量 | 条件 | 含义 |
|------|------|------|
| `temp_k(ijk)` | `isp == OH` | Kolmogorov 时间尺度 |
| `temp_i(ijk)` | `isp == O2` | 积分时间尺度 |

计算公式：

$$\tau_{mix} = \frac{\beta}{f_{mixer}}$$

## 4. 与 IEM 模型的对比

| 特性 | IEM 模型 | TCR 模型 |
|------|----------|----------|
| **C_φ 常数** | 固定值 (如 2.0) | 动态计算 (1-10) |
| **混合速率** | 仅基于 SGS 粘度 | SGS + 分子粘度 |
| **组分区分** | 统一处理 | 产物/反应物/自由基分别处理 |
| **kappa 修正** | 无 | 有 |

### TCR 模型优势

1. **自适应性**: C_φ 根据当地流动状态动态调整
2. **物理一致性**: 分子粘度参与混合过程
3. **组分敏感性**: 不同组分使用不同的混合速率

## 5. 输入输出

### 5.1 输入变量

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `gam_sgs(ijk)` | real | 亚格子扩散系数 |
| `visc(ijk)` | real | 分子粘度 |
| `ajc(ijk)` | real | 网格体积 |
| `f(ijk+nfo(...))` | real | 滤波后的标量值 |
| `kappa(isp,ijk)` | real | 反应物体积分数 |
| `dyn_LM` | real array | 动态模型参数 |

### 5.2 输出变量

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `coef(pc,ijk)` | real | 修改后的对角系数 |
| `coef(bpc,ijk)` | real | 修改后的右端项 |
| `temp_i(ijk)` | real | 积分时间尺度 (O2) |
| `temp_k(ijk)` | real | Kolmogorov 时间尺度 (OH) |

## 6. 代码结构

```fortran
subroutine mixer
  use arrays    ! 数组模块
  use global    ! 全局变量
  use chemistry ! 化学参数

  ! 局部变量声明
  integer :: i,j,k,jk,ijk,ifld
  real :: beta, fbar, f_mixer, kpab, C_phi

  ! 循环遍历所有网格点
  do k = 2, n
    do j = 2, m
      jk = jo(j) + ko(k)
      do i = 2, l
        ijk = i + jk

        ! 获取滤波值
        fbar = f(ijk + nfo(nf + ifld*nsc + isp))

        ! 计算 f_mixer
        f_mixer = (gam_sgs(ijk) + visc(ijk)) / (abs(ajc(ijk))**(2.0/3.0))

        ! 获取 kappa 值
        kpab = kappa(isp,ijk)
        kpab = min(1.0, max(0.01, kpab))

        ! 计算动态 C_phi
        if (产物) then
          C_phi = sqrt(c_products * c_radicals)
        else if (反应物) then
          C_phi = sqrt(c_reactants * c_radicals)
        else
          C_phi = c_radicals
        end if
        C_phi = max(1.0, min(10.0, C_phi))

        ! 计算混合系数 beta
        beta = 0.5 * f_mixer * C_phi

        ! 时间尺度输出
        if (isp == OH) temp_k = beta / f_mixer
        if (isp == O2) temp_i = beta / f_mixer

        ! 更新系数矩阵
        coef(pc,ijk)  = coef(pc,ijk)  + beta
        coef(bpc,ijk) = coef(bpc,ijk) + beta * fbar
      end do
    end do
  end do
end subroutine mixer
```

## 7. 物理参数

### 7.1 混合常数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `c_products` | - | 产物 C_φ 系数 (动态) |
| `c_reactants` | - | 反应物 C_φ 系数 (动态) |
| `c_radicals` | - | 自由基 C_φ 系数 (动态) |

### 7.2 时间尺度

- **积分时间尺度** (`temp_i`): 基于湍流积分长度
- **Kolmogorov 时间尺度** (`temp_k`): 基于最小湍流尺度

## 8. 注意事项

1. **循环范围**: 从 i=2, j=2, k=2 开始，跳过边界点
2. **单位一致性**: 所有物理量使用国际单位制
3. **kappa 限制**: 限制在 [0.01, 1.0] 范围内避免数值不稳定
4. **C_φ 限制**: 限制在 [1.0, 10.0] 范围内

## 9. 相关文件

- `fieldpdf.F90` - PDF 方法主程序
- `stochastic.F90` - 随机过程处理
- `reactor.F90` - TCR 反应模型
- `gamma_*.F90` - 亚格子模型

