# module exchange

# module_exchange.F90 - MPI 通信模块

> **源文件**: `0.src.TCR.dyn728/module_exchange.F90`
> **功能**: MPI 并行通信所需的全局变量声明

---

## 1. 模块概述

定义 MPI 分布式内存并行计算所需的通信变量。

---

## 2. MPI 进程变量

| 变量 | 类型 | 说明 |
|------|------|------|
| `ndoms` | `integer` | MPI 进程总数 |
| `mydom` | `integer` | 当前进程编号 (0-based) |
| `myid` | `integer` | 当前进程 ID |
| `mytid` | `integer` | 当前进程线程 ID |
| `maxtid` | `integer` | 最大线程数 |
| `maxdom` | `integer` | 最大域数 |
| `maxhlo` | `integer` | 最大重叠单元数 |

### 2.1 通信参数

| 变量 | 类型 | 说明 |
|------|------|------|
| `info` | `integer` | MPI info 对象 |
| `tag` | `integer` | MPI 消息标签 |
| `nsize` | `integer` | 通信组大小 |
| `ierr` | `integer` | 错误码 |
| `mpibuflen` | `integer` | MPI 缓冲区长度 |
| `maxexch` | `integer` | 最大交换次数 |
| `incexch` | `integer` | 当前交换次数 |

### 2.2 状态变量

| 变量 | 类型 | 说明 |
|------|------|------|
| `master` | `logical` | 是否主进程 |
| `slave` | `logical` | 是否从进程 |
| `load_bal` | `logical` | 是否启用负载均衡 |

---

## 3. 数组变量

### 3.1 域通信数组

| 变量 | 维度 | 说明 |
|------|------|------|
| `domxch(:,:,:)` | `(maxdom, maxhlo, 2)` | 域交换映射 |
| `domext(:)` | `(maxdom)` | 域扩展信息 |
| `tid(:)` | `(maxdom)` | 进程 ID 表 |

### 3.2 缓冲区

| 变量 | 维度 | 说明 |
|------|------|------|
| `array(:)` | `(:)` | 通用数组缓冲区 |
| `mpibuffer(:)` | `(:)` | MPI 消息缓冲区 |

### 3.3 状态数组

| 变量 | 维度 | 说明 |
|------|------|------|
| `istat(:)` | `(mpi_status_size)` | MPI 状态数组 |

---

## 4. 并行域负载均衡

| 变量 | 类型 | 说明 |
|------|------|------|
| `dprefdom` | `integer` | 首选域 |
| `pb_rdcf_all` | `integer` | 所有域的读/写系数 |
| `pb_rdcf_ndoms` | `integer` | 各域读写系数数量 |

---

## 5. 使用说明

此模块通过 `use exchange` 在所有需要 MPI 通信的子程序中引用。

### 5.1 典型引用方式

```fortran
use exchange
```

### 5.2 常用变量

- `mydom + 1` → 1-based 域编号
- `tid(mydom)` → 当前进程在 tid 表中的位置

---

*最后更新: 2026-03-26*


