# boffin stop

# boffin_stop.F90

## 功能概述
异常终止子程序。在检测到致命错误时调用，输出错误位置信息并终止MPI程序。

## 主要子程序/函数

| 名称 | 功能 |
|------|------|
| `boffin_stop` | 错误终止 |

## 算法描述

```fortran
write(mout,*) 'STOP called: file:', file, ', line: ', line
call flush(mout)
call mpi_abort(mpi_comm_world, info, ierr)
stop
```

## 参数
| 参数 | 类型 | 说明 |
|------|------|------|
| `file` | character | 出错文件名 |
| `line` | integer | 出错行号 |

## 依赖模块
- `global`：输出单元 mout
- `exchange`：MPI 通信 (info, ierr, mpi_comm_world)

## 使用场景
在代码中通过 `STOP('file.F90', line)` 形式调用，定位致命错误位置。

