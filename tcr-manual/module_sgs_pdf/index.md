# module sgs pdf

# module_sgs_pdf.F90 - SGS PDF 模块

> **源文件**: `0.src.TCR.dyn728/module_sgs_pdf.F90`
> **功能**: 亚格子 PDF 方法的变量声明

---

## 1. 模块概述

定义随机场 (Stochastic Field) PDF 方法所需的全局变量。

---

## 2. 变量声明

### 2.1 场数

| 变量 | 类型 | 说明 |
|------|------|------|
| `nfield` | `integer` | 随机场数量 (样本数) |
| `ifld` | `integer` | 当前场索引 |

### 2.2 标志位

| 变量 | 类型 | 说明 |
|------|------|------|
| `pdf` | `logical` | 是否启用 PDF 方法 |
| `read_pdf` | `logical` | 是否读取 PDF 重启文件 |
| `write_pdf` | `logical` | 是否写入 PDF 重启文件 |
| `noise_reduction` | `logical` | 是否启用噪声削减 |
| `ifail` | `integer` | 错误标志 |

### 2.3 数组

| 变量 | 维度 | 说明 |
|------|------|------|
| `xrand(:,:)` | `(nfield+1, :)` | 随机数数组 |
| `stochastic_source(:,:)` | `(nfield+1, :)` | 随机源项 |
| `rdot(:,:)` | `(nsp, nfield+1)` | 反应率 (双精度) |
| `rdot_mean(:,:)` | `(nsp, nfield+1)` | 平均反应率 |

---

## 3. 使用说明

此模块通常在 `fieldpdf.F90` 和 `stochastic.F90` 中通过 `use sgs_pdf` 引用。

---

*最后更新: 2026-03-26*


