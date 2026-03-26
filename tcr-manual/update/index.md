# update

# update.F90 - 速度与压力更新子程序

## 1. 程序概述

`update` 子程序是 SIMPLE-like 算法的**速度与压力修正**核心步骤。在压力修正方程求解后，根据压力修正量 `dp` 更新速度分量和压力场。

## 2. 调用关系

```
boffin.F90 (主循环)
    └── update(u,v,w,dp)  ← 在压力修正方程求解后调用
```

## 3. 算法说明

### 3.1 速度修正公式

速度修正遵循 SIMPLE 算法：

$$u^* = u^{n} - \frac{\Gamma}{\rho} \frac{\partial dp}{\partial x}$$

其中：
- $\Gamma$ = 运动粘度 (gam)
- $\rho$ = 密度
- $dp$ = 压力修正量

### 3.2 压力更新

$$p^{n+1} = p^n + dp$$

### 3.3 可压缩 vs 不可压缩

| 模式 | 密度更新 | 说明 |
|------|----------|------|
| 可压缩 | `rho += 0.5 * drhodp * dp` | 状态方程耦合 |
| 不可压缩 | 无更新 | 密度为常数 |

## 4. 代码解析

```fortran
subroutine update(u,v,w,dp)
  use arrays, only : jo,ko,gi,gj,gk,gam,w1,w2,w3,p,pold, &
                     rho,drhodt,b11,b22,b33,drhodp,dfdx,dfdy,dfdz
  use chemistry, only : pressr
  use exchange
  use global

  integer :: i,j,k,jk,ijk,ijkn,ijke,ijkr
  real :: u(lower:upper),v(lower:upper),w(lower:upper), dp(lower:upper)
  real :: tip,tjp,tkp,tau

  ! ========== X 方向速度修正 ==========
  do k = 2,n
    do j = 2,m
      jk = jo(j) + ko(k)
      do i = 1,l
        ijk = i + jk
        ijkn = ijk + 1  ! 东向邻居
        tau = w1(ijk)*gam(ijk) + (1.0-w1(ijk))*gam(ijkn)
        tip = b11(ijk) * tau
        gi(ijkn) = gi(ijkn) - tip * (dp(ijkn) - dp(ijk))
      enddo
    enddo
  enddo

  ! ========== Y 方向速度修正 ==========
  do k = 2,n
    do j = 1,m
      jk = jo(j) + ko(k)
      do i = 2,l
        ijk = i + jk
        ijke = ijk + jo(2)  ! 北向邻居
        tau = w2(ijk)*gam(ijk) + (1.0-w2(ijk))*gam(ijke)
        tjp = b22(ijk) * tau
        gj(ijke) = gj(ijke) - tjp * (dp(ijke) - dp(ijk))
      enddo
    enddo
  enddo

  ! ========== Z 方向速度修正 ==========
  do k = 1,n
    do j = 2,m
      jk = jo(j) + ko(k)
      do i = 2,l
        ijk = i + jk
        ijkr = ijk + ko(2)  ! 上向邻居
        tau = w3(ijk)*gam(ijk) + (1.0-w3(ijk))*gam(ijkr)
        tkp = b33(ijk) * tau
        gk(ijkr) = gk(ijkr) - tkp * (dp(ijkr) - dp(ijk))
      enddo
    enddo
  enddo

  ! ========== 压力更新 ==========
  p(:) = p(:) + dp(:)

  ! ========== 压力梯度计算 ==========
  call gradient(dp, dfdx, dfdy, dfdz)

  ! ========== 速度更新 ==========
  do k = 2,n
    do j = 2,m
      jk = jo(j) + ko(k)
      do i = 2,l
        ijk = i + jk
        tip = gam(ijk) / rho(ijk)
        u(ijk) = u(ijk) - tip * dfdx(ijk)
        v(ijk) = v(ijk) - tip * dfdy(ijk)
        w(ijk) = w(ijk) - tip * dfdz(ijk)
      enddo
    enddo
  enddo

  ! ========== 密度更新 (可压缩) ==========
  if (compressible) then
    do k = 1,np1
      do j = 1,mp1
        jk = jo(j) + ko(k)
        do i = 1,lp1
          ijk = i + jk
          rho(ijk) = rho(ijk) + 0.5 * drhodp(ijk) * dp(ijk)
          drhodt(ijk) = drhodt(ijk) + 0.5 * drhodp(ijk) * dp(ijk) / dtim
        enddo
      enddo
    enddo
  endif
end subroutine update
```

## 5. 关键变量

### 5.1 输入参数

| 参数 | 含义 |
|------|------|
| `u, v, w` | 速度分量 (将被更新) |
| `dp` | 压力修正量 |

### 5.2 内部系数

| 变量 | 含义 |
|------|------|
| `gi, gj, gk` | 速度通量向量 (动量方程系数) |
| `gam` | 有效扩散系数 (分子 + SGS) |
| `w1, w2, w3` | 网格权重因子 |
| `b11, b22, b33` | 网格系数矩阵对角元 |

### 5.3 梯度计算

| 变量 | 含义 |
|------|------|
| `dfdx, dfdy, dfdz` | 压力修正梯度 |
| `gradient()` | 梯度计算子程序 |

## 6. 网格权重说明

程序使用**网格中心到面中心插值**：

```fortran
! 有效粘度插值
tau = w1(ijk) * gam(ijk) + (1.0-w1(ijk)) * gam(ijkn)
```

其中 `w1, w2, w3` 是面中心权重，通常取 0.5（线性插值）。

## 7. SIMPLE 算法流程

```
1. 预测步: 求解动量方程得到 u*, v*, w*
2. 压力修正: 求解压力 Poisson 方程得到 dp
3. 更新步: 修正速度场 (update) 和更新压力
4. 迭代: 返回步骤 2 直到收敛
```

## 8. 注意事项

1. **边界处理**：循环从 2 开始，避开第一层边界（边界条件单独处理）
2. **梯度计算**：使用 `gradient` 子程序计算压力梯度
3. **可压缩性**：仅在 `compressible = .true.` 时更新密度
4. **隐式修正**：速度修正使用隐式格式，保证数值稳定性

## 9. 相关文件

| 文件 | 关系 |
|------|------|
| `gradient.F90` | 梯度计算子程序 |
| `press.F90` | 压力修正方程构建 |
| `cgsol.F90` | 压力方程求解器 |
| `boffin.F90` | 调用 update 的主程序 |

