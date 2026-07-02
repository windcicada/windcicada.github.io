# gradient

# gradient.F90 - Gradient Calculation

## 概述

`gradient` 子程序使用中心差分方法计算标量场的空间梯度（∂f/∂x, ∂f/∂y, ∂f/∂z），用于通量计算和湍流模型。

## 调用关系

- **调用者**: 求解器各模块
- **使用模块**: `arrays`, `exchange`, `global`

## 算法原理

### 网格导数计算

使用二阶中心差分：

```fortran
dxdi = 0.5 * (x(i+1) - x(i-1))
dfdi = 0.5 * (f(i+1) - f(i-1))
```

### 坐标变换雅可比

逆变与协变坐标转换：

```fortran
ajp = dxdi*(dydj*dzdk - dydk*dzdj) 
    - dxdj*(dydi*dzdk - dydk*dzdi) 
    + dxdk*(dydi*dzdj - dydj*dzdi)
```

### 梯度变换

从计算坐标转换到物理坐标：

```fortran
deta1dx = (dydj*dzdk-dydk*dzdj)/ajp
dfdx = dfdi*deta1dx + dfdj*deta2dx + dfdk*deta3dx
```

## 输入参数

| 参数 | 说明 |
|------|------|
| `f(lower:upper)` | 输入标量场 |

## 输出参数

| 参数 | 说明 |
|------|------|
| `dfdx(lower:upper)` | x 方向梯度 |
| `dfdy(lower:upper)` | y 方向梯度 |
| `dfdz(lower:upper)` | z 方向梯度 |

## MPI 通信

使用 `pbsrhl` 进行并行通信，确保梯度在域边界正确传递。

## 精度

- 空间精度: 二阶中心差分
- 适用于结构化和非结构化网格

