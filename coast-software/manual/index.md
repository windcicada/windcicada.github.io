# COAST v1 用户指南


COAST v1 为 Linux x86_64 高性能计算集群提供目标机链接包和独立示例数据。本页是对发布手册的简明说明；请以下载包内的 `COAST.v1-USER_MANUAL.pdf` 为准。

## 1. 下载前确认

- 使用 Linux x86_64 集群环境；并行运行依赖 OpenMPI / Slurm。
- 同时下载三个 `.tar.gz` 文件及各自的 `.sha256` 文件。
- 示例数据必须完整解压；不要拆分复制 `case.json`、`Restart/` 或 `boundary_conditions.d`。

解压后顶层目录可能仍使用 `AECSC-D.1-*` 名称。这是为兼容目标机链接脚本和数据资产而保留的名称，请不要重命名目录或内部文件。

## 2. 校验与解压

在项目目录执行：

```bash
sha256sum -c COAST.v1-SourceFile.tar.gz.sha256
sha256sum -c COAST.v1-FlameD-ExampleData.tar.gz.sha256
sha256sum -c COAST.v1-GTMC-ExampleData.tar.gz.sha256

tar -xzf COAST.v1-SourceFile.tar.gz
tar -xzf COAST.v1-FlameD-ExampleData.tar.gz
tar -xzf COAST.v1-GTMC-ExampleData.tar.gz
```

校验成功后再解压。摘要文件不在压缩包内部，须与相应压缩包位于同一目录。

## 3. 目标机链接与审计

源文件包提供 225 个主程序对象、6 个重映射对象及运行所需库和资产，不含 Fortran/C/C++ 源码、`.mod` 文件或最终链接的可执行程序。请在目标机加载指定模块后执行：

```bash
cd AECSC-D.1-SourceFile-Link
module purge
module load gcc/7.3.0
module load mpi/openmpi/4.1.1-gcc7.3.0

./scripts/target_link.sh
./scripts/target_verify.sh

INSTALL=$(pwd)
test -x "$INSTALL/bin/aecsc"
```

`target_verify.sh` 应成功完成完整性、依赖和 RPATH 检查。通过后，此目录即安装根目录，不要从其他包复制运行资产。

## 4. 示例验证

示例输入根应保持只读，输出位置放在输入根外。GTMC 固定 128 个 MPI 进程，FlameD 固定 192 个 MPI 进程。先执行不推进时间步的验证：

```bash
PROJECT=/path/to/project
INSTALL="$PROJECT/AECSC-D.1-SourceFile-Link"
GTMC="$PROJECT/AECSC-D.1-GTMC-ExampleData"
mkdir -p "$PROJECT/runs/gtmc"

"$INSTALL/bin/aecsc" "$GTMC/case.json" --print-resolved > "$PROJECT/runs/gtmc/case.resolved.json"
mpirun -np 128 "$INSTALL/bin/aecsc" "$GTMC/case.json" \
  --validate --output "$PROJECT/runs/gtmc"
```

通过 `--validate` 只表示配置、路径与 MPI 进程数匹配；正式计算仍须使用该示例所要求的进程数。

## 5. 提交集群作业

运行环境必须与链接时一致。根据集群环境加载模块后：

```bash
export LD_LIBRARY_PATH="$INSTALL/lib:${LD_LIBRARY_PATH:-}"
export PATH="$INSTALL/bin:${PATH}"
```

在作业脚本中使用 `"$INSTALL/bin/aecsc"` 的绝对路径，不要依赖 Slurm 临时目录或相对路径。GTMC 建议 2 个节点、每节点 64 进程；FlameD 建议 3 个节点、每节点 64 进程。实际队列、账户和资源申请请遵循所在集群规范。

## 6. 常见问题

| 现象 | 建议处理 |
| --- | --- |
| 找不到 `.sha256` 文件 | 重新取得压缩包外部的同名摘要文件，并与压缩包放在一起。 |
| `required expanded path is missing` | 回到已成功通过 `target_verify.sh` 的安装目录，确认未混用旧文件。 |
| `mpirun` 从 Slurm 临时目录启动失败 | 在作业脚本中改用 `"$INSTALL/bin/aecsc"` 的绝对路径。 |
| `start_read.F90` 停止 | 重新完整解压对应示例，确认 Restart、Decomp、边界数据完整，且 MPI 数正确。 |

## 7. 可修改与不可修改内容

可修改：`case.json` 中与研究目标相关的 JSON 参数，以及个人工作目录中新增的 JSON 文件。

不可随意修改：`boundary_conditions.d`、`Restart/`、`Decomp/`、`mesh_identity.*`，以及安装根中的 `lib/`、`registry/`、`Fuels/`、`schema/`、`scripts/`。复杂入口或边界拓扑需要匹配的只读资产与 Restart/网格数据，请联系维护者处理。

[English Quick Guide →](/coast-software/en/manual_en/)
