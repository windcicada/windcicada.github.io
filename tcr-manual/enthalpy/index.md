# enthalpy

# enthalpy.F90 - Enthalpy Calculation

## 概述

`enthalpy` 子程序基于温度和物种摩尔数计算混合物的比焓。使用 NASA 多项式格式的热力学数据。

## 调用关系

- **调用者**: 温度计算、流场求解器
- **使用模块**: `chemistry`, `global`

## 算法原理

### NASA 多项式

焓值计算采用双区 NASA 多项式：

```fortran
h(T) = R * [∑(c_k * T^k) + c6]   (k = 1 to 5)
```

其中系数存储在 `cjan(nt, k, i)` 中：
- `nt = 1`: 高温区 (T > temp_common)
- `nt = 2`: 低温区 (T ≤ temp_common)

### 计算流程

```fortran
! 第五项
fun = Σ(cjan(5,i) * y(i)) * T / 5

! 累积 4-1 项
do k = 4, 1, -1
  c1 = Σ(cjan(k,i) * y(i))
  fun = (c1/k + fun) * T
end do

! 常数项
c1 = Σ(cjan(6,i) * y(i))
fun = fun + c1

enth = gascon * fun
```

## 输入参数

| 参数 | 说明 |
|------|------|
| `temp` | 温度 (K) |
| `y` | 物种摩尔数数组 (kmol/kg) |

## 输出参数

- `enth` - 比焓 (J/kg)

## 关键公式

**比焓**:
$$h = R \sum_{i=1}^{n_{sp}} y_i \left[ \sum_{k=1}^{5} \frac{c_{k,i}}{k} T^k + c_{6,i} \right]$$

## 温度区间

- `temp_common(i)`: 物种 i 的多项式切换温度
- 高于该温度使用高温系数，低于则使用低温系数

