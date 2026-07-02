# locate

# locate.F90

## 功能概述
**网格定位子程序**。确定空间点 (xp, yp, zp) 是否位于指定网格单元内，并返回所在单元索引。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `locate` | 网格单元定位 |

## 算法描述

### 1. 单元顶点计算
```fortran
ijk = i + jo(j) + ko(k)
! 获取 8 个顶点
ijks = ijk - 1          ! i-1, j, k
ijkw = ijk - jo(2)      ! i, j-1, k
ijkl = ijk - ko(2)      ! i, j, k-1
! ... 等等
```

### 2. 面中心计算
```fortran
xc = 0.25 * (xv(ijks) + xv(ijksw) + xv(ijkls) + xv(ijklsw))
yc = 0.25 * (yv(ijks) + yv(ijksw) + yv(ijkls) + yv(ijklsw))
zc = 0.25 * (zv(ijks) + zv(ijksw) + zv(ijkls) + zv(ijklsw))
```

### 3. 内嵌判断
对每个面，检查点是否在面内侧：
```fortran
dl = nx*(xp-xc) + ny*(yp-yc) + nz*(zp-zc) + eps
if (dl >= 0.0) then  ! 在面外侧
```

### 4. 容差
```fortran
eps = 10.0 * uround * |ajc|^(1/3)
```
使用机器精度和单元体积确定容差。

## 输出参数
| 参数 | 说明 |
|------|------|
| `inside_cell` | 逻辑：点是否在单元内 |
| `i0, j0, k0` | 单元索引（如果在单元内）|

## 依赖模块
- `arrays`：ajc, io, jo, ko, xv, yv, zv
- `extras`：normal
- `global`：imax, jmax, kmax, uround

