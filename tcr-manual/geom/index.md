# geom

# geom.F90 — 网格几何量计算

## 功能概述

计算网格的几何属性，包括：
- **单元中心坐标** `(x, y, z)`
- **雅可比行列式** `ajc`
- **坐标变换系数** `b11` ~ `b33`（协变/逆变度量张量相关）

## 调用关系

```
input → geom → weight
         ↓
    GRID_QUALITY (检查网格质量)
```

## 核心算法

### 1. 单元中心坐标

使用 8 点平均计算单元中心（与顶点坐标相关）：

```
x(ijk) = 0.125 * (xv(ijk) + xv(ijks) + xv(ijkw) + xv(ijksw)
               + xv(ijkl) + xv(ijkls) + xv(ijklw) + xv(ijklsw))
```

其中索引偏移：
- `ijks = ijk - 1`       (i-1)
- `ijkw = ijk - jo(2)`   (j-1)
- `ijkl = ijk - ko(2)`   (k-1)

### 2. 雅可比行列式

在每个内部单元计算坐标变换的雅可比：

```fortran
ajc(ijk) = dxdi*(dydj*dzdk-dydk*dzdj)   &
          -dxdj*(dydi*dzdk-dydk*dzdi)   &
          +dxdk*(dydi*dzdj-dydj*dzdi)
```

其中：
- `dxdi = ∂x/∂ξ` (ξ 方向的偏导数)
- `dxdj = ∂x/∂η` (η 方向的偏导数)
- `dxdk = ∂x/∂ζ` (ζ 方向的偏导数)

### 3. 坐标变换系数 b

计算度量张量分量（用于散度形式方程的系数）：

| 系数 | 定义 |
|------|------|
| `b11` | `(∂η/∂x)² + (∂η/∂y)² + (∂η/∂z)² * J` |
| `b22` | `(∂ξ/∂x)² + (∂ξ/∂y)² + (∂ξ/∂z)² * J` |
| `b33` | `(∂ζ/∂x)² + (∂ζ/∂y)² + (∂ζ/∂z)² * J` |
| `b12` | `(∂η·∂ξ) * J` |
| `b13` | `(∂η·∂ζ) * J` |
| `b23` | `(∂ξ·∂ζ) * J` |

公式示例（b11）：
```fortran
deta1dx =  (dydj*dzdk-dydk*dzdj)/ajp
deta1dy = -(dxdj*dzdk-dxdk*dzdj)/ajp
deta1dz =  (dxdj*dydk-dxdk*dydj)/ajp
b11(ijk) = (deta1dx**2+deta1dy**2+deta1dz**2)*ajp
```

## 边界处理

对 6 个面边界的单元中心进行特殊处理：

| 边界 | 索引 | 权值 |
|------|------|------|
| 入口 (i=1) | `ibs(j,k)` | `w1 = 1.0` |
| 出口 (i=lp1) | `ibn(j,k)` | `w1 = 0.0` |
| 西面 (j=1) | `ibw(k,i)` | `w2 = 1.0` |
| 东面 (j=mp1) | `ibe(k,i)` | `w2 = 0.0` |
| 下面 (k=1) | `ibl(i,j)` | `w3 = 1.0` |
| 上面 (k=np1) | `ibr(i,j)` | `w3 = 0.0` |

边界单元的雅可比设为 0（避免在边界计算中引入误差）。

## MPI 并行通信

使用 `pbsrhl` 进行域间数据交换：
```fortran
call pbsrhl(x,2)  ! 交换 x 坐标
call pbsrhl(y,2)  ! 交换 y 坐标
call pbsrhl(z,2)  ! 交换 z 坐标
call pbsrhl(ajc,1)! 交换雅可比
```

## 网格质量检查

调用 `GRID_QUALITY` 检查网格质量，若有问题则终止：

```fortran
Call GRID_QUALITY (iflag)
if(iflag.eq.1) then
  write(scrn,*) ' ERROR : GRID PROBLEM: STOP '
  call BOFFIN_STOP( __FILE__, __LINE__ )
endif
```

## 变量说明

| 变量 | 类型 | 说明 |
|------|------|------|
| `x, y, z` | real数组 | 单元中心坐标 |
| `ajc` | real数组 | 雅可比行列式 |
| `b11~b33` | real数组 | 坐标变换系数 |
| `xv, yv, zv` | real数组 | 顶点坐标（输入） |
| `w1, w2, w3` | real数组 | 边界权值 |
| `jo, ko` | integer数组 | 索引偏移量 |

## 公式汇总

### 雅可比（协变基）
```
J = ∂(x,y,z)/∂(ξ,η,ζ) = dxdi*(dydj*dzdk-dydk*dzdj) - ...
```

### 逆变度量张量
```
b_ij = (∂ξ^i/∂x_k) * (∂ξ^j/∂x_k) * J
```

---
*Generated from geom.F90*

