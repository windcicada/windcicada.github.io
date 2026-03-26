# pbrdcf

# pbrdcf.F90 - 域交换配置读取

> **源文件**: `0.src.TCR.dyn728/pbrdcf.F90`
> **功能**: 读取并行域配置文件中关于域间数据交换的信息

---

## 1. 程序概述

从配置文件中读取域间 Halo 交换信息，建立 `domxch` 数组。

---

## 2. 调用方式

```fortran
call pbrdcf(mw, iok, ioconf)
```

### 2.1 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `mw` | `integer` | 读取模式 |
| `iok` | `integer` | 输出: 错误标志 |
| `ioconf` | `integer` | 配置文件的单元号 |

### 2.2 mw 选项

| 值 | 说明 |
|----|------|
| `PB_RDCF_NDOMS` | 仅读取域数量 |
| `PB_RDCF_ALL` | 读取全部配置 |

---

## 3. 主要变量

### 3.1 网格参数

| 变量 | 说明 |
|------|------|
| `lp3` | X 方向节点数 |
| `mp3` | Y 方向节点数 |
| `np3` | Z 方向节点数 |

### 3.2 循环控制

| 变量 | 说明 |
|------|------|
| `ih` | Halo 深度循环 |
| `ihalo` | 最大 Halo 层数 |
| `iex` | 交换索引 |

---

## 4. 配置文件格式

```
! Domain decomposition
ndoms = 4
!
! Domain 1: [ix1,ix2] × [iy1,iy2] × [iz1,iz2]
! ...
```

---

## 5. 编译选项

```fortran
#undef PBSRHL_CORNERS   ! 禁用角点交换
#define PBSRHL_CORNERS 1  ! 启用角点交换 (默认)
```

---

## 6. 相关子程序

| 子程序 | 功能 |
|--------|------|
| `pbconf` | 域配置主程序 |
| `pbload` | 负载均衡 |
| `pbsrhl` | Halo 交换执行 |

---

*最后更新: 2026-03-26*


