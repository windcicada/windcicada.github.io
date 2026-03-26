# pbload

# pbload.F90 - 域负载均衡子程序

> **源文件**: `0.src.TCR.dyn728/pbload.F90`
> **功能**: MPI 进程与计算域的负载均衡映射

---

## 1. 程序概述

根据各计算节点的处理器性能和负载情况，将 MPI 进程合理分配到各计算域。

---

## 2. 输入/输出

### 2.1 参数

```fortran
subroutine pbload(tids)
integer :: tids(0:nsize-1)  ! 输出: 进程到域的映射
```

---

## 3. 域信息数组

### 3.1 dominf 结构

| 列索引 | 内容 |
|--------|------|
| `dominf(j,0)` | 原始域编号 |
| `dominf(j,1)` | lp3 (X 方向节点数) |
| `dominf(j,2)` | mp3 (Y 方向节点数) |
| `dominf(j,3)` | np3 (Z 方向节点数) |
| `dominf(j,4)` | nodes = lp3*mp3*np3 |
| `dominf(j,5)` | 原始主机 ID |
| `dominf(j,6)` | 新域编号 |

### 3.2 计算节点信息

```fortran
integer, allocatable :: hids(:)     ! 主机 ID
integer, allocatable :: score(:)   ! 性能得分
integer, allocatable :: count(:)   ! 负载计数
```

---

## 4. 算法流程

### 4.1 获取主机名

```fortran
call mpi_get_processor_name(hostname, lhostname, ierr)
```

### 4.2 收集主机信息

所有进程将自己的主机名广播给其他进程，建立主机列表。

### 4.3 负载评分

根据各主机的 CPU 核心数、历史负载等因素计算性能得分。

### 4.4 排序分配

将域按计算量排序，分配给性能最高的主机。

---

## 5. 调试功能

```fortran
#define DEBUG_PBLOAD
```

启用后输出详细的负载分配信息。

---

## 6. 使用说明

在 `pbconf.F90` 之后调用，确保域分解与进程映射正确。

---

*最后更新: 2026-03-26*


