# linsol

# linsol.F90 — 线性代数求解器

## 功能概述

包含三个线性代数子程序：
1. **linsol** - LU 分解求解线性方程组 $Ax = b$
2. **dgedi** - 计算矩阵行列式和逆矩阵
3. **dswap** - 交换两个向量

## 1. linsol — 线性方程组求解

### 输入
```fortran
subroutine linsol(a,n,d,b)
double precision :: a(n,n)  ! 系数矩阵 (会被修改)
integer :: n                ! 矩阵维度
double precision :: b(n)    ! 右端向量
```

### 输出
```fortran
double precision :: b(n)    ! 解向量
double precision :: d       ! 行列式符号 (+/-1)
```

### 算法

使用 **LU 分解 + 列主元消去法**：

1. **选主元**: 找每列最大绝对值元素
2. **行交换**: 将主元行移至当前位置
3. **LU 分解**: $PA = LU$
4. **前向代换**: $Ly = Pb$
5. **后向代代**: $Ux = y$

### 代码流程

```fortran
! 列主元选择
maxa = maxval(abs(a))
if (maxa == 0) → 奇异矩阵错误

! LU 分解
do j = 1,n
  do i = j,n
    summ = a(i,j) - Σ a(i,1:j-1) * a(1:j-1,j)
    a(i,j) = summ
  enddo
  ! 选主元
  if (j ≠ imax) 交换行
enddo

! 求解
do i = 1,n  ! 前向
do i = n,1,-1  ! 后向
```

### 错误检查

```fortran
if (maxa == 0.0d+00) then
  write(mout,*) 'singular matrix in linsol'
  call boffin_stop( __FILE__, __LINE__ )
endif
```

## 2. dgedi — 行列式与逆矩阵

### 接口

```fortran
subroutine dgedi(a,lda,n,ipvt,det,work,job)
double precision :: a(lda,n),det(2),work(n)
integer :: lda,n,ipvt(n),job
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `a` | 输入: LU 分解后的矩阵; 输出: 逆矩阵 |
| `ipvt` | 来自 dgefa 的主元索引 |
| `job` | 11=行列式+逆矩阵, 01=仅逆矩阵, 10=仅行列式 |
| `det` | 行列式: det(1) × 10^det(2) |

### 行列式计算

```fortran
det(1) = 1.0d0
det(2) = 0.0d0
do i = 1,n
  if (ipvt(i) ≠ i) det(1) = -det(1)  ! 行交换改变符号
  det(1) = a(i,i) * det(1)
enddo
```

### 逆矩阵计算

```fortran
! U 的逆
do k = 1,n
  a(k,k) = 1.0/a(k,k)
  a(1:k-1,k) = -a(k,k) * a(1:k-1,k)  ! 列更新
enddo

! L 的逆 (通过行交换)
do kb = 1, nm1
  k = n - kb
  ! ... 乘以 L 的逆
  if (ipvt(k) ≠ k) 交换列
enddo
```

## 3. dswap — 向量交换

### 接口

```fortran
subroutine dswap(n,dx,incx,dy,incy)
double precision :: dx(n),dy(n)
integer :: incx,incy
```

### 功能

交换两个向量：
- `incx=1, incy=1`: 优化循环
- 其他情况: 通用实现

## 调用关系

```
linsol → dswap (内部使用)

dgedi → dscal, daxpy, dswap (BLAS 子程序)
```

## 时间复杂度

| 子程序 | 复杂度 |
|--------|--------|
| linsol | O(n³) |
| dgedi | O(n³) |
| dswap | O(n) |

---
*Generated from linsol.F90*
*Last updated: 2026-03-25*

