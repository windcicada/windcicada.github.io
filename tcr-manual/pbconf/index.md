# pbconf

# pbconf.F90 - 并行域配置子程序

> **源文件**: `0.src.TCR.dyn728/pbconf.F90`
> **功能**: MPI 并行域初始化和配置读取

---

## 1. 程序概述

读取并行域配置文件，建立 MPI 通信拓扑，确定各进程负责的域。

---

## 2. 配置文件

### 2.1 文件位置

```
{path}/Decomp/config
```

### 2.2 读取内容

- 域数量 `ndoms`
- 域分解方式
- 各域的网格范围

---

## 3. 初始化流程

### 3.1 MPI 通信子建立

```fortran
CALL MPI_COMM_SIZE(MPI_COMM_WORLD, NSIZE, ierr)
IF (NSIZE /= NDOMS) THEN
    WRITE(*,*) 'Number of tasks does not match number of domains'
ENDIF
```

### 3.2 进程映射

```fortran
DO I = 0, NDOMS-1
    IF (TID(I) == MYTID) THEN
        MYDOM = I
    ENDIF
ENDDO
```

### 3.3 主/从进程标记

```fortran
MASTER = .FALSE.
SLAVE = .TRUE.
IF (MYDOM == 0) THEN
    MASTER = .TRUE.
    SLAVE = .FALSE.
ENDIF
```

---

## 4. 输出文件

### 4.1 初始化信息

```
{path}/Info/pboff_init.{mydom}
```

内容:
- 域编号 `MYDOM`
- MPI 进程号 `RANK`
- 处理器名 `HOST`

---

## 5. 关键变量

| 变量 | 说明 |
|------|------|
| `mydom` | 当前域编号 (0-based) |
| `mytid` | 当前 MPI 线程 ID |
| `ndoms` | 总域数 |
| `nsize` | MPI 通信组大小 |
| `master` | 是否主进程 |
| `slave` | 是否从进程 |

---

## 6. 调用关系

```
boffin.F90
    └─► pbconf.F90
            ├─► PBRDCF (读取配置)
            └─► MPI_COMM_RANK (获取进程号)
```

---

*最后更新: 2026-03-26*


