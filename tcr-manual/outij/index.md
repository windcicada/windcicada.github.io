# outij

# outij.F90 - 数组输出子程序

> **源文件**: `0.src.TCR.dyn728/outij.F90`
> **功能**: 格式化输出 2D/3D 数组数据到终端

---

## 1. 程序概述

用于调试和诊断的数组输出子程序，将多维数组以表格形式输出到终端。

---

## 2. 调用方式

```fortran
call outij(f, ia, ie, ja, je, k, jmax, jo, kmax, ko, mout, lower, upper, title)
```

**参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `f` | `real, intent(in)` | 待输出数组 |
| `ia, ie` | `integer` | I 方向起止索引 |
| `ja, je` | `integer` | J 方向起止索引 |
| `k` | `integer` | K 方向索引 |
| `jmax` | `integer` | J 方向最大索引 |
| `jo` | `integer, intent(in)` | J 方向偏移数组 |
| `kmax` | `integer` | K 方向最大索引 |
| `ko` | `integer, intent(in)` | K 方向偏移数组 |
| `mout` | `integer` | 输出单元 |
| `lower, upper` | `integer` | 数组边界 |
| `title` | `character` | 输出标题 |

---

## 3. 输出格式

### 3.1 标题格式

```
******...******  Title Here  ******...******
```

### 3.2 数据表格

```
 j=    j1    j2    j3    ...    j15
  i=
 72   1.234E+00  5.678E+00  9.012E+00 ...
 71   2.345E+00  6.789E+00  1.234E+01 ...
  ...
```

- 每行最多显示 15 列 J 方向数据
- I 方向从 `ie` 到 `ia` 逆序输出

---

## 4. 使用示例

```fortran
! 输出 Y-Z 平面 (固定 i)
call outij(f, 1, m, 1, n, i, m, jo, n, ko, &
           mout, lower, upper, 'Velocity U at i=10')

! 输出 X-Y 平面 (固定 k)
call outij(f, 1, l, 1, m, k, m, jo, k, ko, &
           mout, lower, upper, 'Temperature at k=5')
```

---

## 5. 限制

- 每行最多 170 字符
- 最大列数 20 列
- J 方向每页最多 15 列

---

*最后更新: 2026-03-26*


