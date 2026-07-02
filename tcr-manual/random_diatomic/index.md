# random diatomic

# random_diatomic.F90 - 双原子分子随机数生成

> **源文件**: `0.src.TCR.dyn728/random_diatomic.F90`
> **功能**: 为双原子分子模型生成成对随机数

---

## 1. 程序概述

为双原子分子输运模型生成配套的随机数，确保正负成对出现。

---

## 2. 算法

### 2.1 随机数生成

```fortran
do ifld = 1, nfield, 2
    do i = 1, 3
        call random_number(harvest)
        xrand(ifld, i) = real(2*nint(harvest) - 1)
        xrand(ifld+1, i) = -xrand(ifld, i)
    enddo
enddo
```

### 2.2 正负配对

- `xrand(ifld, i)` 取值: +1 或 -1
- `xrand(ifld+1, i)` 取值: -1 或 +1 (相反数)

---

## 3. 变量说明

| 变量 | 说明 |
|------|------|
| `harvest` | 随机数临时变量 |
| `nfield` | 随机场数量 |
| `xrand(ifld,i)` | 第 ifld 个场的第 i 个随机数 |

---

## 4. 物理意义

双原子分子在湍流中的脉动运动需要满足质量守恒和动量守恒，因此随机数成对出现以保证系统平均值为零。

---

*最后更新: 2026-03-26*


