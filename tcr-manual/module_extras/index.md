# module extras

# module_extras.F90 - 额外工具模块

> **源文件**: `0.src.TCR.dyn728/module_extras.F90`
> **功能**: 额外工具函数和变量声明

---

## 1. 模块概述

包含坐标变换和指针赋值等辅助功能。

---

## 2. 坐标变换变量

| 变量 | 类型 | 说明 |
|------|------|------|
| `deta1dx` | `real` | ∂η₁/∂x |
| `deta1dy` | `real` | ∂η₁/∂y |
| `deta1dz` | `real` | ∂η₁/∂z |
| `deta2dx` | `real` | ∂η₂/∂x |
| `deta2dy` | `real` | ∂η₂/∂y |
| `deta2dz` | `real` | ∂η₂/∂z |
| `deta3dx` | `real` | ∂η₃/∂x |
| `deta3dy` | `real` | ∂η₃/∂y |
| `deta3dz` | `real` | ∂η₃/∂z |

### 2.1 法向量

| 变量 | 类型 | 说明 |
|------|------|------|
| `nx` | `real` | 法向量 X 分量 |
| `ny` | `real` | 法向量 Y 分量 |
| `nz` | `real` | 法向量 Z 分量 |
| `sx` | `real` | 切向量 X 分量 |
| `sy` | `real` | 切向量 Y 分量 |
| `sz` | `real` | 切向量 Z 分量 |
| `tx` | `real` | 第二切向 X 分量 |
| `ty` | `real` | 第二切向 Y 分量 |
| `tz` | `real` | 第二切向 Z 分量 |
| `da` | `real` | 微元面积 |

---

## 3. 包含的子程序

### 3.1 assign_pointer

```fortran
function assign_pointer(f, lower, upper)
```

**功能**: 创建具有指定边界的指针数组

**参数**:
- `f` - 目标数组
- `lower` - 下界
- `upper` - 上界

**返回**: 指向数组的指针

---

## 4. 使用说明

此模块通过 `use extras` 在需要坐标变换或指针操作的子程序中引用。

---

*最后更新: 2026-03-26*


