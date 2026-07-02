# reactor

# reactor.F90 - 反应器子程序

> **源文件**: `0.src.TCR.dyn728/reactor.F90`
> **功能**: TCR 反应计算与 MPI 并行负载均衡
> **调用关系**: `boffin.F90` → `reactor_TCR` / `reactor`

---

## 1. 程序概述

`reactor.F90` 实现了 TCR 求解器中的化学反应计算模块，采用 **并行 PSR (Partially Stirred Reactor)** 方法：

- **核心功能**: 在分布式内存环境下并行计算化学反应
- **算法**: 将反应计算负载分配到各 MPI 进程
- **适用范围**: 高温 ($T > 800K$) 区域才进行反应计算

### 1.1 子程序列表

| 子程序 | 功能 |
|--------|------|
| `reactor_TCR` | TCR 混合模型的反应计算 |
| `reactor` | 标准 IEM/EMST 混合模型的反应计算 |

---

## 2. 反应计算流程

### 2.1 入口条件判断

```fortran
if (theta >= T_reaction_limit .and. theta < T_upper_limit &
    .and. yn(jfuel).ne.0.0) then
    ! 满足温度和燃料条件，执行反应计算
endif
```

**阈值参数**:
- `T_reaction_limit = 800 K` - 最低反应温度
- `T_upper_limit = 2800 K` - 温度上限（防止数值不稳定）

### 2.2 负载均衡策略

```
┌─────────────────────────────────────────────────────────────┐
│                    MPI 并行负载均衡                          │
├─────────────────────────────────────────────────────────────┤
│ 1. 统计各进程高温单元数 (nnchemc)                             │
│ 2. 计算平均负载: nm = (nt + ndoms - 1) / ndoms              │
│ 3. 计算传输量: ntrans(ip) = nchemc(ip) - nm                  │
│ 4. 正值 → 发送方，负值 → 接收方                               │
│ 5. 构建传输映射矩阵: ntri2j(ip,jp)                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 数据传输格式

**发送数据** (MPI_PACK):
```fortran
! 单元索引、温度、压力、密度、组分、释热率
call mpi_pack (mydom,  1, mpi_integer, ...)  ! 源进程
call mpi_pack (ijk,    1, mpi_integer, ...)  ! 单元索引
call mpi_pack (theta,  1, mpi_double_precision, ...)  ! 温度
call mpi_pack (pressure, 1, mpi_double_precision, ...)  ! 压力
call mpi_pack (den,    1, mpi_double_precision, ...)  ! 密度
call mpi_pack (yold,   nsp, mpi_double_precision, ...)  ! 组分
call mpi_pack (hdot_fg, 1, mpi_double_precision, ...)  ! 释热率
```

---

## 3. MPI 通信机制

### 3.1 通信模式

| 阶段 | 通信类型 | 说明 |
|------|----------|------|
| 负载统计 | `mpi_allgather` | 收集各进程高温单元数 |
| 数据发送 | `mpi_bsend` | 异步缓冲发送 |
| 数据接收 | `mpi_recv` | 同步接收 |
| 结果回传 | `mpi_bsend` | 送回计算结果 |

### 3.2 消息标签

| 标签 | 用途 |
|------|------|
| `666010` | 请求计算 |
| `666020` | 返回结果 |

### 3.3 负载分配算法

```fortran
! 排序发送列表（降序）
do ip=1,nsends
  do jp=1,nsends-1
    if (i2send(jp+1,2) > i2send(jp,2)) then
      ! 交换
    endif
  enddo
enddo
```

---

## 4. 反应计算核心

### 4.1 调用 `react_hc`

```fortran
call react_hc(dt, ijk)
```

- **输入**: 时间步长 `dt`，单元索引 `ijk`
- **输出**: 更新后的组分 `yn(isp)`，释热率 `hdot_fg`

### 4.2 结果回填

```fortran
do isp=1,nsp
    nv = nf + ifld*nsc + isp
    ijkp = nfo(nv) + ijk
    f(ijkp) = sngl(yn(isp))
enddo

field_hdot(ifld,ijk) = sngl(hdot_fg)
```

---

## 5. 错误处理

### 5.1 失败检测

```fortran
if ( fail ) then
    call mpi_allreduce (mpi_in_place, fail, 1, mpi_logical, mpi_lor, ...)
    if ( master ) then
        write (scrn,*) 'reactor: failed during reaction balancing'
    endif
    call boffin_stop(...)
endif
```

### 5.2 调试输出

```fortran
if (nsends > 0) then
    write (mout,*) 'reactor: error'
    write (mout,*) ('(',i2send(ip,1),',',i2send(ip,2),')',ip=1,nsends)
    fail = .true.
endif
```

---

## 6. 代码结构图

```
reactor_TCR / reactor
│
 ├─► 温度/压力/密度提取
 │      tempsv(ijk), denisv(ijk), pressv(ijk)
 │
 ├─► 统计高温单元数 (ichem)
 │      theta >= 800K && theta < 2800K && yn(jfuel) > 0
 │
 ├─► MPI_allgather 负载收集
 │      nnchemc → nchemc
 │
 ├─► 计算负载分配
 │      nm = (nt + ndoms - 1) / ndoms
 │      ntrans = nchemc - nm
 │
 ├─► 构建发送/接收列表
 │      ntri2j(ip,jp)
 │
 ├─► 发送数据到其他进程 (可选)
 │      mpi_bsend / mpi_pack
 │
 ├─► 接收其他进程数据 (可选)
 │      mpi_recv / mpi_unpack
 │
 ├─► 本地反应计算
 │      react_hc(dt, ijk)
 │
 ├─► 等待结果回传 (如有必要)
 │      mpi_recv / mpi_unpack
 │
 └─► 更新流场数据
        f(ijkp), field_hdot(ifld,ijk)
```

---

## 7. 与其他模块的接口

### 7.1 输入

| 模块 | 变量 | 说明 |
|------|------|------|
| `arrays` | `jo, ko, nfo, f, p` | 网格索引和流场数据 |
| `chemistry` | `den, pressure, theta, yn, yold` | 化学状态量 |
| `sgs_pdf` | `field_temperature, field_density, field_hdot` | 随机场数据 |

### 7.2 输出

| 变量 | 用途 |
|------|------|
| `f(ijkp)` | 更新后的组分质量分数 |
| `field_hdot(ifld,ijk)` | 释热率写入随机场 |

---

## 8. 性能考量

### 8.1 通信开销

- 每个高温单元需要 7 × 8 字节 ≈ 56 字节通信
- 大规模问题中通信可能成为瓶颈

### 8.2 负载均衡质量

- 静态负载均衡：每个时间步重新计算
- 依赖于火焰位置分布的动态变化

### 8.3 优化建议

1. **批量通信**: 合并多个单元数据减少消息数
2. **异步通信**: 使用 `mpi_isend`/`mpi_irecv` 重叠计算与通信
3. **自适应阈值**: 根据负载动态调整 `nm`

---

## 9. 关键参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `T_reaction_limit` | 800 K | 最低反应温度 |
| `T_upper_limit` | 2800 K | 温度上限 |
| `tag` (请求) | 666010 | MPI 标签 |
| `tag` (结果) | 666020 | MPI 标签 |

---

*最后更新: 2026-03-26*


