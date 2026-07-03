# COAST 用户手册


# COmbustor Adaptive Simulation Toolkit 

# 燃烧室自适应仿真工具中文用户手册

本手册介绍COmbustor Adaptive Simulation Toolkit(COAST)使用。前半部分主要讲封装版便携程序如何通过 SSH 命令行安装、修改算例、运行计算和查看结果；后半部分介绍非封装版完整工作区、网格/重启动/局部加密方法以及开发维护流程。图形辅助界面是单独的辅助设施，一般不作为主线操作方式。

本文件由 `docs/manual_sections/` 下的章节草稿整合生成；如果后续要大幅修改某一章，建议先修改对应章节草稿，再重新整合。

## 第 1 页：封装版环境配置与 coast-assistant

封装版适合“拿到一个已经打好的运行包，然后在 Linux 服务器上运行算例”的用户。常见目录名类似：

```text
coast-runtime-<version>-linux-x86_64/
```

封装版通常已经带好求解器、`coastctl`、`coast_remap`、模板算例、文档、WebUI 和 nanobot 运行资产。新环境中先确认服务器是 Linux x86_64，并且能找到 `python3` 和 `mpirun`：

```bash
which python3
which mpirun
```

解压后进入封装包根目录。如果你选择原地运行，可以直接使用包内工具：

```bash
cd coast-runtime-<version>-linux-x86_64
bin/coast-assistant --self-test --require-runtime --json
bin/coast-assistant --configure-model
bin/coast-assistant
```

如果你选择安装到固定位置，可以运行：

```bash
./install.sh /opt/coast/runtime
source /opt/coast/runtime/env/coast-env.sh
coast-assistant
```

`bin/coast-assistant` 是封装版的新手入口。它不是求解器本体，而是一个助手启动器：它会调用包内的 COAST MCP 工具，帮助你检查算例、阅读和修改输入文件、查看网格和边界、做运行前检查、启动受控短运行、监看 `screen` 和运行日志。需要浏览器界面时，可以让 assistant 打开 WebUI；WebUI 左侧是聊天，右侧是文件和运行工作台。

封装版中，如果通过 assistant/nanobot 启动真实求解器，仍然要遵守安全流程：先 preflight，再确认启动，再监看进程、`screen` 和 monitor。不要让 assistant 用普通 shell 命令绕过受控流程去启动 solver；如果不用 assistant，请按本手册运行章节的普通手工命令操作。遇到其他问题，例如“怎么改入口温度”“为什么 preflight 不通过”“screen 里这段错误是什么意思”“如何下载 Visit 结果”，都可以直接问 `coast-assistant`，让它先用项目内工具检查后再给建议。

## 第 2 页：源码版环境配置与 coast-assistant

源码版适合需要重新编译、改源码、同步 `compilableCode`、调试工具或准备新封装包的用户。常见目录是完整工作区或可编译源码树，例如：

```text
Coast_software/
compilableCode/
```

源码版不是只拷贝一个可执行文件就能工作。它需要保留 `SRC.Coast/`、`EXEC/`、`docs/`、`scripts/`、`third_party/` 和根目录下的工具入口。新环境中先检查编译和运行依赖：

```bash
which python3
which make
which g++
which mpif90
which mpicxx
which mpirun
```

进入源码版根目录后，先做布局检查：

```bash
cd compilableCode
chmod +x coastctl coast-ui coast-assistant scripts/*.sh
./scripts/check_layout.sh
./scripts/print_quickstart.sh
```

需要重新编译时，在 `SRC.Coast` 下执行：

```bash
cd SRC.Coast
make clean
make -j"$(nproc)"
cd ..
```

编译成功后，主要产物在：

```text
EXEC/coast
EXEC/coast_remap
```

源码版的 `./coast-assistant` 不是 `make` 编译出来的二进制，而是源码树自带的启动脚本。它会调用 `SRC.Coast/tools/coast_assistant.py` 和同目录工具。首次使用时运行：

```bash
./coast-assistant --self-test --json
./coast-assistant --configure-model
./coast-assistant
```

源码版中，普通用户手工运行入口仍是：

```bash
cd EXEC
mpirun -np N ./coast
```

nanobot/assistant 启动 solver 时则必须走 `coast_run_preflight`，再走 `coast_run_short(confirm=true)`，启动后监看 process、`screen` 和 monitor。源码版里遇到编译失败、依赖缺失、`EXEC` 配置不明、mesh/restart 状态不清、测试该跑哪些、是否可以打包等问题，也可以先问 `./coast-assistant`。它会优先阅读项目说明和受控工具输出，再告诉你下一步怎么做。

# 0. 手册导读

欢迎使用COAST。本手册面向第一次接触COAST的使用者来写，默认读者不需要有编程基础，也不需要先学会计算流体、燃烧、并行计算或 Linux 系统管理。你只需要知道自己要做的是：通过 SSH 登录 Linux 服务器，准备一个算例，检查设置，用命令行运行计算，然后查看结果。

这一部分负责最前面的入门内容，主要讲封装版，也就是便携运行包的使用方式。如果你手里拿到的是一个已经打包好的 `coast-runtime-<version>-linux-x86_64` 目录，可以先从这里开始。

## 0.1 这份手册适合谁

这份手册适合以下用户：

- 想先把COAST跑起来，了解算例从准备、运行到查看结果的流程；
- 需要在 Windows 电脑上通过 SSH 命令行操作 Linux 服务器上的COAST；
- 不想一开始就接触源码、编译、测试脚本和开发目录；
- 想知道 `EXEC_TEMPLATE`、`*.d`、`Restart`、`Visit`、端口转发这些词到底是什么意思；
- 后续可能会修改边界条件、运行计算、导出结果，但现在先要完成第一次上手。

注意：这不是开发者源码说明。你可以先不用理解 Fortran、MPI、湍流模型、燃烧机理这些技术细节。新手最重要的是分清“哪些文件可以复制和修改，哪些目录不能随便删”。

## 0.2 推荐新手先走哪条路径

新手推荐使用封装版的 SSH 命令行路径：

1. 在 Windows 端用 SSH 登录 Linux 服务器。
2. 在 Linux 服务器上解压COAST便携包。
3. 复制 `EXEC_TEMPLATE`，创建自己的工作算例。
4. 用文本编辑器或命令行工具修改 `*.d` 设置文件。
5. 用命令行检查算例、边界和网格。
6. 用 `coastctl run --preflight` 做启动前检查，再用 `coastctl run --execute` 启动计算。
7. 用 `coastctl monitor`、`screen`、外部 `.coast_run_logs/` 日志和 `Visit/` 查看运行状态与结果。
8. 如果确实需要图形化预览，再单独启动图形辅助界面；它不是主线运行方式。

这条路径的好处是：你不需要编译程序，也不需要在本机安装完整开发环境。便携包已经包含运行所需的 `coast-solver` 可执行程序、命令行辅助工具、干净算例模板和必要文档。

便携包还提供 nanobot assistant 作为可选新手助手。浏览器方式运行
`bin/coast-nanobot-webui --package-root .`，左侧是对话，右侧是 COAST
工作台，可做上传、文件查看/编辑/下载、运行前检查、短跑、监看、停止和日志
tail；终端方式运行 `bin/coast-nanobot-chat --package-root .`。assistant 只应通过
COAST MCP 工具操作，真实运行前必须先通过 preflight，并且需要明确确认。

## 0.3 封装版和非封装版有什么区别

COAST有两种常见形态：封装版和非封装版。它们是面向不同用途的两个程序形态：封装版用于日常运行算例，非封装版用于源码开发、编译、测试和维护。

### 0.3.1 封装版是什么

封装版也叫便携运行包，通常是一个这样的目录：

```text
coast-runtime-<version>-linux-x86_64/
  SKILL.md
  bin/coast-solver
  bin/coast_remap
  bin/coastctl
  bin/coast-ui
  bin/coast-mcp
  bin/coast-standard-test
  bin/coast-nanobot-chat
  bin/coast-nanobot-webui
  env/coast-env.sh
  EXEC_TEMPLATE/
  ui/static/
  docs/USER_MANUAL.md
  docs/COAST_NANOBOT_ASSISTANT.md
  nanobot/
  agent_skills/
  manifest.json
  PACKAGE_AUDIT.json
  install.sh
```

可以把封装版理解成“已经整理好的运行工具箱”。里面有：

- `bin/coast-solver`：COAST的求解器本体，真正做计算的程序；
- `bin/coast_remap`：C++ Restart 重映射后端，`coastctl run` 在需要把旧 Restart 准备到新 runtime mesh 时默认使用它；
- `bin/coastctl`：命令行操作工具，用来检查算例、查看网格状态、启动运行、监控和停止；
- `bin/coast-ui`：可选图形辅助界面后端，一般不作为主线运行方式；
- `bin/coast-nanobot-webui` 和 `bin/coast-nanobot-chat`：可选 nanobot
  assistant 入口，分别用于浏览器左 chat/右 workbench 和终端对话；
- `bin/coast-mcp` 和 `bin/coast-standard-test`：assistant 和标准检查使用的
  受控工具入口；
- `env/coast-env.sh`：环境设置脚本，用来告诉当前终端在哪里找COAST工具；
- `EXEC_TEMPLATE/`：干净的算例模板，应该复制后再使用；
- `docs/`：说明文档；
- `agent_skills/`：给自动化助手使用的操作说明。

封装版通常不包含完整源码、开发测试目录、很大的 `Restart` 数据或很大的 `Visit` 结果。普通用户日常运行算例时，不需要这些内容。

### 0.3.2 非封装版是什么

非封装版是完整开发工作区，通常类似：

```text
Coast_software/
  SKILL.md
  docs/
  scripts/
  tests/
  SRC.Coast/
  EXEC/
```

非封装版包含源码、测试、工具脚本和默认开发算例。它适合开发者、维护者或需要重新编译 COAST 的用户。比如：

- 修改 COAST 程序源码；
- 重新构建开发版主可执行程序；
- 运行开发测试；
- 打包新的封装版；
- 调试网格、重启动、并行交换等底层方法。

注意：如果你只是要运行已有算例、修改输入文件、看结果，新手阶段不建议直接从非封装版开始。非封装版能做的事情更多，也更容易误删或误改关键文件。

### 0.3.3 两者如何选择

如果你拿到的是封装包，并且目标是“把算例跑起来”，请使用封装版。

如果你需要修改程序源码、重新编译 COAST，或者有人明确要求你在 `SRC.Coast`、`tests`、`scripts` 里工作，再使用非封装版。

一个简单判断方法：

| 你想做什么 | 推荐使用 |
| --- | --- |
| 第一次试用 COAST | 封装版 |
| 创建自己的工作算例 | 封装版 |
| 用浏览器编辑算例设置 | 封装版 |
| 检查边界和网格 | 封装版 |
| 启动有限步数的计算 | 封装版 |
| 查看 Visit 输出 | 封装版 |
| 修改 COAST 源码 | 非封装版 |
| 重新编译程序 | 非封装版 |
| 打包新的运行包 | 非封装版 |

## 0.4 阅读本手册时要记住的安全原则

第一，不要直接修改 `EXEC_TEMPLATE`。它是干净模板，应该保留原样。每次做演示、测试或正式计算，都先复制一份工作算例，例如 `EXEC.demo`、`EXEC.my_case`。

第二，不要随便删除用户算例里的这些目录：

```text
Restart/
runtime_mesh/
Decomp/
Geometry/
Visit/
```

这些目录可能保存重启动数据、运行网格、并行分区、几何文件和结果文件。删掉之后，有些计算可能无法续算，有些结果可能无法再打开。

第三，不要一上来就启动长时间正式计算。推荐先做短步数测试，确认算例能正常启动、边界没有明显错误、输出目录正常，再做正式计算。

第四，Windows 浏览器访问 Linux 服务器上的 COAST 图形界面 时，通常需要 SSH 端口转发。浏览器地址看起来是 `127.0.0.1`，但真正的程序运行在 Linux 服务器上。

## 0.5 常用术语速查

### COAST

COAST 是计算程序的名字。它负责读取算例设置、网格、边界条件和初始数据，然后进行流动、燃烧或相关物理过程的数值计算。

在封装版中，真正执行计算的程序通常是：

```text
bin/coast-solver
```

### 算例

算例就是“一次计算任务的文件夹”。它里面放着这次计算需要的输入文件、网格信息、边界条件、重启动数据和输出结果。

封装版里的 `EXEC_TEMPLATE` 是模板算例。你应该复制它，得到自己的工作算例，例如：

```text
EXEC.demo/
EXEC.engine_test/
EXEC.case001/
```

### 网格

网格是把计算空间切成许多小格子的方式。COAST 不是直接在连续空间里计算，而是在这些小格子上逐步计算速度、压力、温度、组分等量。

可以把网格理解成“计算用的坐标纸”。格子越细，越能描述复杂结构，但计算量也越大。

### 边界

边界是计算区域的外壳或内部固体表面。常见边界包括入口、出口和壁面。

- 入口：流体从这里进入计算区域；
- 出口：流体从这里离开计算区域；
- 壁面：流体不能穿过去的固体表面；
- IBM 表面：由浸入边界方法识别出的复杂几何表面。

边界条件就是告诉 COAST：“这个边界上应该是什么物理状态”。例如入口速度是多少、温度是多少、出口压力怎么处理、壁面是否无滑移。

### Restart

`Restart` 是重启动数据目录。它保存某个时刻的计算状态，让 COAST 可以从这个状态继续算，而不是每次都从头开始。

可以把 `Restart` 理解成游戏存档。没有存档时只能从最初状态开始；有存档时可以从中间继续。

注意：`Restart` 文件通常和并行计算的 rank 数有关。普通用户的直接命令仍是 `cd EXEC && mpirun -np N ./coast`。如果 MPI size differs from the active runtime mesh rank count，且 `input.d` 和 Mesh-5 配置允许 startup regrid / restart remap，启动阶段会在 solver reads fields 之前走受控 preflight/write/remap 路径，并把简要诊断写入 `screen`。如果 rank、Restart 文件、mesh identity、remap 后端或门禁条件不满足，启动会失败关闭并保留诊断，而不是半自动进入求解。

### Visit

`Visit` 是结果输出目录，也常指 VisIt 可视化软件使用的一组结果文件。COAST 通常会生成：

```text
Visit/solution.visit
Visit/solution.<step>.domain.<rank>.vtk
```

其中 `solution.visit` 像一个目录清单，里面引用了很多 `.vtk` 分块结果文件。只复制 `solution.visit` 通常不够，必须一起带上它引用的 `.vtk` 文件。

注意：这里的 `Visit` 目录和 VisIt 软件名字相关。手册里保留 `Visit` 这个专有名词。

### 服务器

服务器通常指运行 COAST 的 Linux 机器。它可能是一台远程高性能计算节点、一台工作站，或者实验室里的 Linux 主机。

COAST 计算通常在 Linux 服务器上运行，因为计算量大、依赖 Linux 环境，并且可能需要多个 CPU 核心或 MPI 并行。

### 图形辅助界面

图形辅助界面 是浏览器界面。COAST 的封装版提供中文 图形辅助界面，让你不用直接记很多命令，也能查看算例状态、修改常用 `*.d` 文件、预览边界和网格、监控运行、整理 Visit 输出。

图形辅助界面 后端在 Linux 服务器上启动，Windows 用户通过浏览器访问。

### 端口

端口是网络服务的门牌号。COAST 图形辅助界面 默认示例使用 `18765` 端口。

如果 图形辅助界面 启动在服务器的 `127.0.0.1:18765`，意思是：服务器本机的 18765 端口上有一个只允许本机访问的网页服务。

### 端口转发

端口转发是 SSH 提供的一种“安全通道”。它可以把 Windows 电脑上的某个本地端口，连接到 Linux 服务器上的某个端口。

例如：

```powershell
ssh -N -L 18765:127.0.0.1:18765 user@server
```

意思是：在 Windows 本机打开 `127.0.0.1:18765` 时，SSH 会把访问转送到服务器上的 `127.0.0.1:18765`。

这就是为什么浏览器里输入的是本机地址，但看到的是服务器上 COAST 图形界面 的页面。

# 1. 第一次认识 COAST

本章用不依赖专业背景的方式说明 COAST 的基本工作方式。你不需要马上记住所有术语，只要先知道每个东西大概负责什么。

## 1.1 COAST 在一次计算中做什么

一次 COAST 计算大致可以想成下面这条流程：

```text
读取算例文件
  -> 读取或生成网格
  -> 识别边界和几何
  -> 读取初始状态或 Restart
  -> 按时间步推进计算
  -> 定期写出 Restart 和 Visit 结果
```

也就是说，COAST 需要几个关键输入：

- 算例设置：这次要算多久、输出频率是多少、使用哪些物理模型；
- 网格：计算区域如何被切成小格子；
- 边界条件：入口、出口、壁面分别怎么处理；
- 初始状态：从头开始，还是从某个 `Restart` 存档继续；
- 运行资源：用多少 rank 并行计算。

计算过程中，COAST 会写出结果：

- `screen` 或相关日志：运行时的文字信息；
- `Restart/`：可继续计算的存档；
- `Visit/`：可视化结果；
- 其他诊断文件：例如探针、热释放或统计输出。

## 1.2 一个算例是什么

一个算例就是一个完整的工作文件夹。你可以把它理解成一个项目文件夹，里面包含这次计算需要的一切。

封装版里有一个模板：

```text
EXEC_TEMPLATE/
```

你不应该直接在模板上运行正式计算，而是复制一份：

```text
EXEC.demo/
```

复制后的 `EXEC.demo` 就是你的工作算例。你后续编辑 `input.d`、`boundary_conditions.d`、启动计算、生成结果，都发生在这个工作算例里。

一个典型工作算例可能长这样：

```text
EXEC.demo/
  input.d
  ibm_mesh.d
  boundary_conditions.d
  vtk_output.d
  spray.d
  spark.d
  probe.d
  heat_release.d
  Geometry/
  Decomp/
  Restart/
  runtime_mesh/
  Visit/
  screen
```

不是每个算例一开始都有全部目录。有些目录会在生成网格、启动计算或写出结果后出现。

## 1.3 `*.d` 文件是什么

COAST 的很多输入设置放在以 `.d` 结尾的文本文件里，例如：

| 文件 | 主要用途 |
| --- | --- |
| `input.d` | 控制重启动、总步数、输出间隔、燃烧和求解器常用设置 |
| `ibm_mesh.d` | 控制几何、网格、IBM 扫描和静态网格相关设置 |
| `boundary_conditions.d` | 设置入口、出口、壁面、坐标选择器和组分 |
| `vtk_output.d` | 设置 Visit/VTK 输出哪些结果字段 |
| `spray.d` | 喷雾和蒸发相关设置 |
| `spark.d` | 点火源相关设置 |
| `probe.d` | 压力探针相关设置 |
| `heat_release.d` | 热释放诊断相关设置 |

这些文件是普通文本文件，可以用编辑器打开。封装版的 图形辅助界面 会把其中一些常用设置做成表单，减少手工编辑出错的机会。

注意：能打开并不表示可以随便改。新手阶段建议先通过 图形辅助界面 修改常用项，或者严格按照后续章节说明修改。

## 1.4 网格为什么重要

COAST 计算的是流体在空间和时间中的变化。计算机不能直接处理无限连续的空间，所以要先把区域切成很多小单元，这些小单元就是网格。

网格会影响：

- 计算能否识别几何形状；
- 入口、出口和壁面的位置是否正确；
- 结果是否足够细致；
- 计算速度和内存占用；
- `Restart` 是否能继续使用。

如果网格太粗，细小结构可能看不清。如果网格太细，计算可能非常慢。对新手来说，第一次上手不需要自己设计复杂网格，先学会查看网格状态和预览边界更重要。

## 1.5 边界为什么重要

边界条件告诉 COAST 计算区域和外界如何相连。即使网格正确，边界条件写错，计算也可能失败或得到没有物理意义的结果。

常见例子：

- 入口速度方向写反，流体可能从出口方向流入；
- 出口没有正确设置，压力波可能反射；
- 壁面漏设，流体可能穿过本该是固体的区域；
- 组分名字写错，燃烧计算可能找不到对应物种。

封装版支持通过 `boundary_conditions.d` 设置边界。它还支持坐标选择边界，也就是用空间范围来指定哪些外边界格子属于入口、出口或壁面。这样即使没有 patch STL 标签，也可以设置常见边界。

## 1.6 Restart 为什么像“存档”

长时间计算不适合每次从头开始。COAST 会把某些时刻的状态写到 `Restart/` 目录，下次可以从那里继续。

`Restart` 里通常包括每个并行 rank 对应的数据。rank 可以先理解成“并行计算时分出来的工作份数”。如果一个算例用 128 个 rank 运行，COAST 可能把数据分成 128 份。

这也是为什么续算时要特别注意 rank 数。rank 数、网格、Restart 文件数量不匹配时，COAST 可能无法启动。

注意：不要因为 `Restart/` 很大就直接删除。删除前必须确认不再需要续算，或者已经另存备份。

## 1.7 Visit 结果为什么不能只发一个文件

COAST 的 Visit 输出一般不是单个结果文件，而是一组文件。

常见结构是：

```text
Visit/
  solution.visit
  solution.000010.domain.000000.vtk
  solution.000010.domain.000001.vtk
  solution.000010.domain.000002.vtk
  ...
```

`solution.visit` 像目录清单，告诉 VisIt 软件每个时间步对应哪些 `.vtk` 文件。真正的大量数据在 `.vtk` 文件里。

所以分享结果时，不能只发送：

```text
Visit/solution.visit
```

还需要一起发送它引用的 `.vtk` 文件。否则别人打开时可能只看到空结果或报错。

## 1.8 为什么通常需要 Linux 服务器和 Windows 端连接

很多用户的日常电脑是 Windows，而 COAST 运行环境通常在 Linux 服务器上。这是因为：

- COAST 计算量大，适合在服务器或工作站上运行；
- 并行计算、MPI、运行脚本和文件权限在 Linux 上更常见；
- 服务器可能有更多 CPU 核心、更大内存和更稳定的长时间运行环境。

但用户并不一定要坐在服务器前面。常见工作方式是：

```text
Windows 电脑
  浏览器打开 图形辅助界面
  PowerShell 建立 SSH 端口转发
        |
        |  安全连接
        v
Linux 服务器
  解压 COAST 便携包
  保存算例文件
  启动 coast-ui
  运行 COAST 计算
```

这样做的效果是：计算留在服务器上，操作界面显示在 Windows 浏览器里。

## 1.9 常见目录结构图

假设你把封装包放在 Linux 服务器的固定目录下，目录可能是这样：

```text
/opt/coast/coast-runtime-2026.06-linux-x86_64/
  bin/
    coast-solver
    coast_remap
    coastctl
    coast-ui
  env/
    coast-env.sh
  EXEC_TEMPLATE/
    input.d
    ibm_mesh.d
    boundary_conditions.d
    vtk_output.d
  EXEC.demo/
    input.d
    ibm_mesh.d
    boundary_conditions.d
    vtk_output.d
    Restart/
    Visit/
  docs/
    USER_MANUAL.md
```

其中：

- `coast-runtime-2026.06-linux-x86_64/` 是封装包根目录；
- `EXEC_TEMPLATE/` 是模板，不要直接改；
- `EXEC.demo/` 是复制出来的工作算例，可以按任务修改；
- `bin/` 里是运行工具；
- `env/` 里是环境脚本；
- `docs/` 里是文档。

# 2. 封装版快速上手

本章从一个新用户的角度，完整走一遍封装版的首次使用流程。命令会说明在哪里执行、执行后应该看到什么。

为了方便说明，下面假设：

- Linux 服务器用户名是 `user`；
- Linux 服务器地址是 `server`；
- COAST 便携包文件名类似 `coast-runtime-2026.06-linux-x86_64.tar.gz`；
- 解压后的目录叫 `coast-runtime-2026.06-linux-x86_64`；
- 工作算例叫 `EXEC.demo`；
- 图形辅助界面 使用端口 `18765`。

实际使用时，请把 `user`、`server`、版本号和路径替换成你的真实信息。

## 2.1 准备 Linux 服务器终端

首先登录 Linux 服务器。可以使用 Windows PowerShell：

```powershell
ssh user@server
```

这条命令在 Windows PowerShell 中执行。`user` 是服务器用户名，`server` 是服务器地址，可以是主机名或 IP 地址。

执行后，如果是第一次连接，PowerShell 可能询问是否信任服务器指纹。确认地址无误后输入 `yes`。随后输入服务器密码或使用密钥登录。

登录成功后，你会看到 Linux 命令提示符，后续解压和启动 图形辅助界面 的命令都在这个 Linux 终端里执行。

## 2.2 上传或找到 COAST 便携包

如果管理员已经把便携包放到服务器上，你只需要进入它所在目录。

如果便携包在 Windows 本机，可以用 `scp` 上传。这个命令在 Windows PowerShell 中执行：

```powershell
scp .\coast-runtime-2026.06-linux-x86_64.tar.gz user@server:~
```

含义是：把当前 Windows 目录下的压缩包上传到服务器用户家目录。

执行成功后，一般不会有很长输出。你可以登录服务器后检查文件是否存在：

```bash
ls -lh ~/coast-runtime-2026.06-linux-x86_64.tar.gz
```

这条命令在 Linux 服务器终端中执行。正常情况下，会看到文件大小和文件名。

## 2.3 解压便携包

在 Linux 服务器终端中，进入你想放 COAST 的目录，例如家目录：

```bash
cd ~
```

解压压缩包：

```bash
tar -xzf coast-runtime-2026.06-linux-x86_64.tar.gz
```

执行后，会生成一个目录：

```text
coast-runtime-2026.06-linux-x86_64/
```

进入这个目录：

```bash
cd coast-runtime-2026.06-linux-x86_64
```

检查里面是否有关键文件：

```bash
ls
```

正常情况下，应该能看到类似：

```text
SKILL.md  bin  docs  env  EXEC_TEMPLATE  install.sh  manifest.json
```

如果没有看到 `bin`、`env`、`EXEC_TEMPLATE`，说明你可能没有进入正确目录，或者压缩包不完整。

## 2.4 选择安装或原地运行

封装版有两种使用方式：安装到固定目录，或者就在解压目录里原地运行。

### 2.4.1 原地运行

新手第一次试用，推荐先原地运行。这样不会把文件复制到别处，路径关系最直观。

在封装包根目录执行：

```bash
source env/coast-env.sh
```

这条命令会设置当前终端环境。执行成功通常没有输出。

然后检查 `coastctl` 是否可用：

```bash
bin/coastctl doctor --case-dir EXEC_TEMPLATE --json
```

正常情况下，会输出一段 JSON 文本，里面包含检查结果。如果看到明显的 `error`、`missing` 或路径不存在，需要先确认便携包是否完整。

注意：`source env/coast-env.sh` 只对当前终端生效。重新打开一个 Linux 终端后，需要再执行一次。

### 2.4.2 安装到固定目录

如果你希望把 COAST 安装到固定位置，例如 `$HOME/.local/coast`，可以执行：

```bash
bash install.sh "$HOME/.local/coast"
```

这条命令在封装包根目录执行。它会把运行包安装到 `$HOME/.local/coast`。

安装后进入任意目录前，先加载安装位置的环境脚本：

```bash
source "$HOME/.local/coast/env/coast-env.sh"
```

检查安装是否可用：

```bash
coastctl doctor --case-dir "$HOME/.local/coast/EXEC_TEMPLATE" --json
```

安装方式的好处是路径稳定；原地运行的好处是简单直接。第一次学习时，两种都可以，但不要在同一个算例上混用多个包版本。

## 2.5 创建自己的工作算例

不要直接修改 `EXEC_TEMPLATE`。先复制一份工作算例。

如果你使用原地运行，并且当前在封装包根目录，执行：

```bash
cp -a EXEC_TEMPLATE EXEC.demo
```

`cp -a` 会尽量保留目录结构和文件属性。执行成功通常没有输出。

检查工作算例是否出现：

```bash
ls EXEC.demo
```

正常情况下，会看到 `input.d`、`ibm_mesh.d`、`boundary_conditions.d` 等输入文件。

接着验证算例：

```bash
bin/coastctl case validate --case-dir EXEC.demo --json
```

这条命令会检查算例输入文件是否基本完整。正常情况下，JSON 输出里应该没有严重错误。

再查看网格状态：

```bash
bin/coastctl mesh status --case-dir EXEC.demo --json
```

这条命令会检查算例当前网格相关状态。不同算例的输出内容可能不同，但如果缺少关键网格文件或配置错误，通常会在这里提示。

如果你使用安装方式，命令可能需要使用安装后的 `coastctl`：

```bash
coastctl case validate --case-dir "$HOME/.local/coast/EXEC.demo" --json
```

注意：每一个演示、测试或正式任务都建议使用单独的工作算例目录。不要把多个任务混在同一个 `EXEC.demo` 里。

## 2.6 可选辅助：启动中文图形辅助界面

图形辅助界面 在 Linux 服务器上启动。假设你使用原地运行，并且当前在封装包根目录，先确认环境已经加载：

```bash
source env/coast-env.sh
```

然后启动 图形辅助界面：

```bash
bin/coast-ui --workspace "$PWD" --case-dir "$PWD/EXEC.demo" --host 127.0.0.1 --port 18765
```

这条命令的意思是：

- `--workspace "$PWD"`：当前封装包目录作为工作空间；
- `--case-dir "$PWD/EXEC.demo"`：使用刚复制出来的工作算例；
- `--host 127.0.0.1`：只允许服务器本机访问这个 Web 服务；
- `--port 18765`：图形辅助界面 监听 18765 端口。

执行后，这个 Linux 终端会被 图形辅助界面 占用，不会立刻回到命令提示符。正常情况下，你会看到服务启动相关文字，表示 图形辅助界面 正在运行。

注意：不要关闭这个终端。关闭后 图形辅助界面 服务也会停止。你可以另外再开一个终端做其他操作。

如果你使用安装方式，可以类似执行：

```bash
coast-ui --workspace "$HOME/.local/coast" --case-dir "$HOME/.local/coast/EXEC.demo" --host 127.0.0.1 --port 18765
```

## 2.7 可选辅助：在 Windows 上建立 SSH 端口转发

如果 COAST 图形辅助界面 启动在远程 Linux 服务器上，Windows 浏览器通常不能直接访问服务器的 `127.0.0.1:18765`。因为服务器的 `127.0.0.1` 指的是服务器自己，不是你的 Windows 电脑。

这时需要在 Windows PowerShell 中新开一个窗口，执行：

```powershell
ssh -N -L 18765:127.0.0.1:18765 user@server
```

请把 `user@server` 替换成你的服务器用户名和地址。

这条命令里的几个部分含义如下：

- `ssh`：连接服务器；
- `-N`：只建立连接，不打开远程命令行；
- `-L 18765:127.0.0.1:18765`：把 Windows 本机的 18765 端口转发到服务器本机的 18765 端口；
- `user@server`：你的服务器登录信息。

执行成功后，PowerShell 窗口通常会停在那里，没有明显输出。这是正常现象。只要这个窗口保持打开，端口转发就保持有效。

注意：不要关闭这个 PowerShell 窗口。关闭后，浏览器到服务器 图形辅助界面 的通道也会断开。

## 2.8 可选辅助：在浏览器访问图形辅助界面

保持两个窗口都打开：

- Linux 服务器终端：正在运行 `bin/coast-ui ...`；
- Windows PowerShell：正在运行 `ssh -N -L ...`。

然后在 Windows 浏览器地址栏输入：

```text
http://127.0.0.1:18765
```

正常情况下，你会看到 COAST 中文 图形辅助界面 页面。

注意：这里的 `127.0.0.1` 是 Windows 本机地址。由于 SSH 端口转发，它会被转送到 Linux 服务器上的 COAST 图形辅助界面。

## 2.9 如果本地 18765 端口被占用怎么办

如果 PowerShell 提示本地端口已经被占用，可以换一个 Windows 本地端口，例如 `18766`：

```powershell
ssh -N -L 18766:127.0.0.1:18765 user@server
```

这表示：

- Windows 本机使用 `18766`；
- Linux 服务器 图形辅助界面 仍然使用 `18765`。

浏览器中要打开：

```text
http://127.0.0.1:18766
```

注意：只有冒号后面的本地端口变了，服务器端 图形辅助界面 的端口没有变。

## 2.10 可选辅助：图形界面页面分别能做什么

不同版本的 COAST 图形辅助界面 页面名称可能略有变化，但通常会围绕以下用途组织。

### 2.10.1 算例状态

算例状态页面用于查看当前连接的是哪个工作空间、哪个算例目录，以及输入文件是否完整。

你可以在这里确认：

- 当前算例是不是 `EXEC.demo`，而不是 `EXEC_TEMPLATE`；
- 关键 `*.d` 文件是否存在；
- `Restart`、`Visit`、网格目录是否存在；
- 最近一次检查有没有错误提示。

如果页面显示当前算例是 `EXEC_TEMPLATE`，应停止操作，回到 Linux 终端复制一个工作算例后再启动 图形界面。

### 2.10.2 输入文件表单

输入文件表单页面用于查看和修改常见 `*.d` 文件里的设置。

常见用途包括：

- 调整 `input.d` 中的步数、输出频率、restart 开关；
- 查看 `ibm_mesh.d` 中的网格和几何设置；
- 修改 `vtk_output.d` 中的输出字段；
- 查看 `spray.d`、`spark.d`、`probe.d`、`heat_release.d` 的相关设置。

新手建议每次只改少量参数，保存后立刻做一次验证。不要一次修改很多文件，否则出错时很难判断是哪一处导致的。

### 2.10.3 边界条件

边界条件页面用于查看和编辑 `boundary_conditions.d`。

你可以在这里确认：

- 哪些区域是入口；
- 哪些区域是出口；
- 哪些区域是壁面；
- 边界选择使用的是坐标范围还是 IBM 表面；
- 入口速度、温度、压力、组分是否符合预期。

如果页面提供边界预览功能，建议每次修改后都预览一次。边界条件是新手最容易改错的地方之一。

### 2.10.4 网格和 IBM 预览

网格和 IBM 预览页面用于查看计算区域、网格状态和复杂几何表面的识别情况。

这里的目标不是让新手分析所有网格细节，而是确认最基本的问题：

- 网格是否能被识别；
- 几何是否在预期位置；
- 流体区域和固体区域是否明显反了；
- 边界选择是否为空；
- 网格状态检查是否报错。

如果预览显示为空、范围明显不对，或者边界选择数量为 0，不建议继续启动正式计算。

### 2.10.5 运行监控

运行监控页面用于查看 COAST 是否正在运行，以及最近的日志、步数和输出状态。

你可以用它判断：

- 程序是否启动成功；
- 当前计算到了哪一步；
- 是否写出了 Restart 或 Visit；
- 是否出现错误信息；
- 是否需要温和停止计算。

注意：正式运行前应先做短步数测试。不要直接让一个新算例长时间运行。

### 2.10.6 Visit 输出和下载

Visit 输出页面用于整理可视化结果。

它通常帮助你找到：

- `Visit/solution.visit`；
- 对应的 `.vtk` 分块结果文件；
- 哪些时间步已经输出；
- 下载或打包结果所需的文件组。

再次提醒：`solution.visit` 不是完整结果本身。分享结果时，需要连同它引用的 `.vtk` 文件一起处理。

## 2.11 常见连接失败原因和处理

如果浏览器打不开 `http://127.0.0.1:18765`，不要急着修改算例。先按下面顺序检查。

### 2.11.1 Linux 服务器上的 图形辅助界面 没有启动

现象：

- 浏览器提示无法访问；
- PowerShell 端口转发窗口看起来正常；
- Linux 服务器上没有正在运行的 `coast-ui`。

处理方法：

回到 Linux 服务器终端，在封装包根目录重新启动：

```bash
bin/coast-ui --workspace "$PWD" --case-dir "$PWD/EXEC.demo" --host 127.0.0.1 --port 18765
```

确认终端没有立刻退出。如果命令立刻结束并显示错误，先按错误提示检查路径和算例目录。

### 2.11.2 SSH 端口转发没有建立

现象：

- Linux 服务器上的 图形辅助界面 正在运行；
- Windows 浏览器仍然打不开；
- PowerShell 中没有正在运行的 `ssh -N -L ...` 窗口。

处理方法：

在 Windows PowerShell 中重新执行：

```powershell
ssh -N -L 18765:127.0.0.1:18765 user@server
```

保持这个窗口打开，再刷新浏览器。

### 2.11.3 用户名、服务器地址或登录方式错误

现象：

- PowerShell 提示连接失败；
- 提示密码错误；
- 提示无法解析主机名；
- 提示连接超时。

处理方法：

先确认普通 SSH 能不能登录：

```powershell
ssh user@server
```

如果普通 SSH 都无法登录，端口转发也不会成功。需要先确认用户名、服务器地址、网络、VPN、密码或密钥配置。

### 2.11.4 本地端口被占用

现象：

- PowerShell 提示本地端口绑定失败；
- 错误信息里可能包含 `bind`、`address already in use` 等字样。

处理方法：

换一个 Windows 本地端口，例如：

```powershell
ssh -N -L 18766:127.0.0.1:18765 user@server
```

然后浏览器访问：

```text
http://127.0.0.1:18766
```

### 2.11.5 图形辅助界面 端口写错

现象：

- Linux 端启动时使用了一个端口；
- Windows 转发或浏览器访问时使用了另一个端口；
- 三处端口没有对应起来。

处理方法：

确认三处设置：

```text
Linux coast-ui 端口：--port 18765
PowerShell 转发：-L 18765:127.0.0.1:18765
浏览器地址：http://127.0.0.1:18765
```

如果你使用本地备用端口 `18766`，则应是：

```text
Linux coast-ui 端口：--port 18765
PowerShell 转发：-L 18766:127.0.0.1:18765
浏览器地址：http://127.0.0.1:18766
```

### 2.11.6 图形辅助界面 绑定到了错误地址

新手推荐让 图形辅助界面 绑定到：

```text
127.0.0.1
```

也就是启动时使用：

```bash
bin/coast-ui --workspace "$PWD" --case-dir "$PWD/EXEC.demo" --host 127.0.0.1 --port 18765
```

这样 图形辅助界面 只在服务器本机开放，再通过 SSH 安全转发给 Windows 浏览器。

如果把 `--host` 改成其他地址，可能会遇到服务器防火墙、安全策略或访问范围问题。新手阶段不建议随意更改。

### 2.11.7 算例路径写错

现象：

- 浏览器能打开页面，但页面报算例不存在；
- 页面显示的不是你想操作的算例；
- Linux 终端提示 `case-dir` 不存在。

处理方法：

在 Linux 服务器终端中确认当前目录和算例目录：

```bash
pwd
ls -ld EXEC.demo
```

如果当前目录不是封装包根目录，可以使用绝对路径启动 图形辅助界面：

```bash
bin/coast-ui --workspace "/opt/coast/coast-runtime-2026.06-linux-x86_64" --case-dir "/opt/coast/coast-runtime-2026.06-linux-x86_64/EXEC.demo" --host 127.0.0.1 --port 18765
```

请把路径替换成你的真实路径。

### 2.11.8 误把模板当成工作算例

现象：

- 图形辅助界面 页面显示正在操作 `EXEC_TEMPLATE`；
- 你还没有复制 `EXEC.demo`；
- 修改后发现模板被改了。

处理方法：

停止 图形辅助界面，重新复制模板：

```bash
cp -a EXEC_TEMPLATE EXEC.demo
```

然后用工作算例启动：

```bash
bin/coast-ui --workspace "$PWD" --case-dir "$PWD/EXEC.demo" --host 127.0.0.1 --port 18765
```

如果已经改动了 `EXEC_TEMPLATE`，不要继续在上面做正式任务。请联系管理员或从原始封装包重新取一份干净模板。

## 2.12 第一次上手后的检查清单

完成本章后，你应该已经做到：

- 知道封装版和非封装版的区别；
- 知道 COAST、算例、网格、边界、Restart、Visit 的基本含义；
- 在 Linux 服务器上解压了 COAST 便携包；
- 知道如何选择原地运行或安装到固定目录；
- 从 `EXEC_TEMPLATE` 复制出了自己的工作算例；
- 用 `coastctl` 做了基本算例检查；
- 在 Linux 服务器上启动了中文 图形辅助界面；
- 在 Windows PowerShell 中建立了 SSH 端口转发；
- 在浏览器打开了 COAST 图形辅助界面；
- 知道连接失败时优先检查 图形辅助界面、SSH 转发、端口和路径。

下一步通常是学习如何修改算例设置和边界条件。继续之前，请先确认你操作的是复制出来的工作算例，而不是 `EXEC_TEMPLATE`。


# 3. 修改算例设置

本章讲的是“已经有一个 COAST 算例以后，怎样安全地改它”。如果你使用封装版，建议先复制 `EXEC_TEMPLATE`，得到自己的工作算例，例如 `EXEC.demo`，后面所有示例都用这个名字。

注意：不要直接修改模板目录，也不要把 `Restart`、`runtime_mesh`、`Decomp`、`Visit` 这类运行产物当成设置文件来手工改。设置主要在几个 `*.d` 文件里。

## 3.1 一个算例里哪些东西可以改

一个普通工作算例大致长这样：

```text
EXEC.demo/
  input.d
  ibm_mesh.d
  boundary_conditions.d
  vtk_output.d
  spray.d
  spark.d
  probe.d
  heat_release.d
  mesh5_auto_refine.d
  Geometry/
  Fuels/
  Restart/
  Decomp/
  runtime_mesh/
  Visit/
```

这里最适合普通用户修改的是上面列出的 `*.d` 文件。它们是 COAST 启动和运行时读取的文本配置文件，记录“这个算例怎么跑”“网格和几何从哪里来”“入口出口是什么”“输出哪些结果”等信息。

一般不要手动改这些目录：

- `Restart/`：重启动数据，保存上一次计算的流场。如果随便删改，续算可能失败。
- `Decomp/`：并行分块和兼容网格文件。它通常由网格工具生成。
- `runtime_mesh/`：运行时网格权威数据，和重启动、rank 数量有关。
- `Visit/`：结果输出目录。这里适合查看和归档，不适合拿来改设置。
- `Geometry/` 和 `Fuels/`：几何和燃料/机理资料可以作为输入，但新手不要在不了解单位、坐标和机理名称时随便替换。

## 3.2 `*.d` 文件是什么

`*.d` 文件就是 COAST 使用的一类文本输入文件。这里的 `.d` 不是某种编程语言，也不是必须双击打开的程序；它只是一个扩展名，表示“direct input”一类的直接输入文件。

你可以把它理解成“算例说明书”。COAST 启动时会按固定规则读这些文件：

- 有些文件按行读取，数值的位置很重要，例如 `input.d` 里很多老式配置就是这种风格。
- 有些文件使用块结构，例如 `&output_control ... /`，这叫 namelist，像一组带名字的选项。
- `boundary_conditions.d` 使用更接近人能读懂的 patch 结构，用来描述入口、出口和壁面。
- `#`、`!`、`C-----` 这类行通常是注释，用来解释后面的内容；注释一般不会被当作数值。

例如 `input.d` 中可能有这样的行：

```text
5000                             /lstep
500                              /stepsave : write restart file interval
500                              /stepplot : write plot file interval
```

意思是：

- `5000` 是总步数 `lstep`；
- 每 `500` 步写一次重启动；
- 每 `500` 步写一次绘图/Visit 输出。

注意：老式按行读取的文件不能随便增删行、调换顺序。你可以改行首的数值，但不要把整段移动到别处。

## 3.3 修改前先做两件事

第一，确认你改的是工作算例，不是模板。下面命令在封装版运行目录执行，也就是能看到 `bin/coastctl` 和 `EXEC_TEMPLATE` 的目录。

```bash
cp -a EXEC_TEMPLATE EXEC.demo
```

执行后应该看到多了一个 `EXEC.demo` 目录。后续修改都在 `EXEC.demo` 里做。

第二，改文件前给单个文件留一个备份。比如要改 `input.d`：

```bash
cp -a EXEC.demo/input.d EXEC.demo/input.d.before_edit
```

执行后应该多出一个 `EXEC.demo/input.d.before_edit`。如果改错，可以对照这个备份恢复具体几行。

注意：不要用 `git reset`、批量删除、清空目录这类办法“恢复”。同一个工作区里可能还有别人正在改别的文件。

## 3.4 图形辅助界面 修改和文本修改有什么区别

COAST 封装版提供中文 图形辅助界面，也允许你直接用文本编辑器修改 `*.d` 文件。两种方式改的是同一批算例文件，但适合不同场景。

| 方式 | 适合做什么 | 优点 | 风险 |
| --- | --- | --- | --- |
| 图形辅助界面 修改 | 新手改常见开关、查看算例状态、做边界预览、检查网格和输出 | 不容易找错文件；界面会把一些文件集中展示；适合边看边改 | 界面不一定暴露所有高级参数；如果多人同时改同一算例，可能互相覆盖 |
| 文本修改 | 精确修改某一行、复制别人给的片段、批量比较配置 | 完整、直接、可审查；适合有明确修改目标时使用 | 容易漏分号、改错单位、删掉必要行，尤其是老式顺序读取文件 |

推荐新手的做法是：

1. 常规设置先用 图形辅助界面 看一遍，确认自己正在操作哪个算例。
2. 只改一两项时，可以在 图形界面 里改。
3. 需要粘贴完整边界 patch、精确调整坐标范围时，可以用文本编辑器改。
4. 文本改完后回到 图形界面 或用 `coastctl` 做检查。

注意：不要同时在浏览器 图形界面 和文本编辑器里打开同一个文件反复保存。先保存一边，再刷新另一边。

## 3.5 常用 `*.d` 文件速查

| 文件 | 主要用途 | 新手常改内容 | 特别提醒 |
| --- | --- | --- | --- |
| `input.d` | 全局运行控制、重启动、总步数、输出间隔、燃烧/PDF 开关、时间步和调试开关 | `lstep`、`stepsave`、`stepplot`、是否重启动、调试输出 | 行顺序很重要；不懂的物理模型不要随便改 |
| `ibm_mesh.d` | 几何/STL、IBM 浸入边界、网格生成、网格分辨率、并行分块、Mesh-4 预览 | 几何文件路径、预览开关、目标 rank、网格报告 | 改它可能导致网格、重启动和 rank 不匹配 |
| `boundary_conditions.d` | 入口、出口、壁面、坐标选择、patch/STL 选择、速度温度压力组分 | 入口速度、出口压力、壁温、甲烷/空气组分、坐标范围 | 本章第 4 章详细讲；改完必须预览 |
| `vtk_output.d` | Visit/VTK 输出哪些变量 | 开关某些输出字段、诊断级别 | 输出越多，文件越大 |
| `spray.d` | 喷雾、液滴、蒸发、喷嘴位置和喷雾输出 | 是否启用喷雾、喷雾燃料、喷嘴参数 | 气相燃烧算例通常保持关闭 |
| `spark.d` | 点火源、点火时间、点火位置、点火持续时间 | 点火开关、点火点坐标、起始步数 | 点火位置必须落在合理流体区域 |
| `probe.d` | 压力探针等监测点控制 | 是否启用、采样间隔 | 当前文件可能很短，常见格式是开关加间隔 |
| `heat_release.d` | 全局热释放率历史或诊断数据 | 通常不手改 | 运行时可能写入；只有明确需要续接热释放历史时才处理 |
| `mesh5_auto_refine.d` | Mesh-5 自动局部加密候选评分 | 是否启用候选生成、各评分权重 | 候选生成不等于正式替换求解网格 |

下面逐个解释。

## 3.6 `input.d`：运行总开关

`input.d` 是最重要的全局控制文件。它不描述具体入口出口，而是告诉 COAST 这个算例总体怎么跑。

常见内容包括：

- 是否从 `Restart/` 读取旧结果继续算。
- 是否写新的 `Restart/` 文件。
- 总步数 `lstep`。
- 写重启动的间隔 `stepsave`。
- 写 Visit/VTK 结果的间隔 `stepplot`。
- LES、燃烧、反应机理、PDF、可压缩流等物理开关。
- 时间步限制、Mach 数保护、调试输出等运行保护开关。

最常见的新手修改是把总步数改小，先做短测。例如原来是：

```text
5000                             /lstep
500                              /stepsave : write restart file interval
500                              /stepplot : write plot file interval
```

如果只是想先跑 50 步看能不能启动，可以改成：

```text
50                               /lstep
25                               /stepsave : write restart file interval
25                               /stepplot : write plot file interval
```

这表示最多跑 50 步，每 25 步写一次重启动和结果。短测通过后，再把步数调大。

关于重启动，`input.d` 里通常会有类似：

```text
true true                   /restart, write to restart
```

第一个 `true` 表示从已有重启动读入，第二个 `true` 表示运行时继续写重启动。新手要注意：

- 如果 `Restart/` 里没有匹配当前 rank 数量的文件，却设置了读取重启动，运行会失败。
- 如果你只是从干净模板开始，通常不应该强行读不存在的重启动。
- 如果你拿的是别人已经跑过的算例，改 rank 数、网格或几何前要先确认重启动还能不能用。

`input.d` 后半部分还有类似这样的块：

```text
&time_control
  time_step_cap_enabled = .true.
  time_step_max = 9.9e-06
  time_step_growth_limit = 1.20
/
```

这种块里每一行都有名字，比较容易读。上面表示启用最大时间步限制，最大时间步是 `9.9e-06` 秒，新时间步每次增长最多 20%。如果计算一开始就不稳定，可以请有经验的人先看这些保护参数，不建议新手自己大幅放宽。

## 3.7 `ibm_mesh.d`：几何、网格和 IBM

`ibm_mesh.d` 管几何和网格。IBM 是 immersed boundary method 的缩写，可以先理解为“用 STL/CAD 几何在背景网格里标记固体、流体和壁面”的方法。

这个文件里常见块包括：

- `&mesh_control`：是否启动网格生成、是否写预览、是否覆盖旧的 `Decomp/`。
- `&mesh_runtime`：当前求解器以哪份网格为权威。
- `&mesh_regrid`：Mesh-4 预览和候选网格相关设置。当前安全路径通常是只打标签、只预览，不直接移动求解网格。
- `&ibm_control`：是否启用 IBM、主几何文件路径、STL 单位、壁面阻尼等。
- `&mesh_geometry`：几何文件列表、STL/CAD 单位、几何外扩或内缩。
- `&mesh_domain`：计算域范围，可以自动从几何推导，也可以手动给出。
- `&mesh_resolution`：基础网格间距和最小网格间距。
- `&mesh_ibm`：流体/固体标记、界面层、CAD 开口等。
- `&mesh_decomposition`：目标 MPI rank 数、分块方法、强制对齐的坐标平面。

如果你只是在现有算例里改入口速度、温度、出口压力，一般不需要动 `ibm_mesh.d`。如果你替换了几何文件、改变网格分辨率、改变 `target_ranks`，就可能影响：

- `Decomp/` 是否需要重建；
- `Restart/` 是否还能继续使用；
- `runtime_mesh/` 是否和当前算例匹配；
- 边界坐标选择是否还选得到原来的入口出口。

注意：`boundary_conditions.d` 只能给已经存在的边界面赋值，不能把 STL 里的固体区域“挖开”成入口。如果一个内部喷口本来没有流体连通面，需要先通过 `ibm_mesh.d` 和网格生成流程建立开口，再在边界文件里赋速度和组分。

## 3.8 `vtk_output.d`：控制 Visit/VTK 输出

`vtk_output.d` 决定结果文件里写哪些变量。Visit/VTK 输出越多，后处理越方便，但文件也越大。

常见写法是：

```text
default true
vtk_diag_level 1
01_Velocity true
02_Static_pressure true
02_Temperature true
04_Heat_release_rate true
```

可以这样理解：

- `default true`：没有在文件里列出的字段，按程序默认行为输出。
- `default false`：只输出明确写成 `true` 的字段。
- `vtk_diag_level`：诊断级别。级别越高，诊断字段越多，文件越大。
- `字段名 true`：输出这个字段。
- `字段名 false`：关闭这个字段。

新手建议保留 `default true` 和较低诊断级别。只有磁盘空间明显不够，或者别人明确告诉你只需要某几个字段时，再减少输出。

## 3.9 `spray.d`：喷雾和液滴

`spray.d` 控制喷雾、液滴、蒸发、液滴和气体之间的质量/动量耦合，以及喷嘴几何。气相甲烷/空气燃烧算例通常会保持：

```text
spray = .false.
```

当 `spray = .true.` 时，文件后面的 `TCR_MULTI_INJECT` 块会定义喷嘴数量、液滴直径分布、喷射位置、方向、锥角、粒子速率和喷射速度。

注意：喷雾不是“多输出几个粒子图”这么简单，它会改变计算物理过程。没有喷雾需求时不要打开。

## 3.10 `spark.d`：点火设置

`spark.d` 控制点火模型，例如是否点火、点火持续时间、点火开始时间、最高点火温度、点火点数量和点火坐标。

典型内容可能像这样：

```text
true      ! spark: true or false
0.005     ! spark duration time used by qdot_max (s)
0.0       ! spark initiation time used by legacy time model (s)
295.0 1800.0  ! initial air temperature and maximum spark temperature (K)
4         ! number of sparks
```

后面的多行坐标就是点火点位置，单位通常是米。点火点应位于合理的流体区域和可燃混合区域附近。如果点火点落在固体里、壁面外、或者完全没有燃料/氧化剂的区域，计算可能跑了也点不着。

注意：`input.d` 中也可能有“是否启用点火”的总开关。实际是否点火，需要总开关和 `spark.d` 内容共同合理。

## 3.11 `probe.d`：探针设置

`probe.d` 用于压力探针等简单监测设置。当前某些算例里它可能只有很短两项，例如：

```text
false  10
```

可以粗略理解为“是否启用”和“采样间隔”一类的设置。普通用户如果只是看整体场图和日志，通常不需要修改它。

## 3.12 `heat_release.d`：热释放率历史

`heat_release.d` 通常保存全局热释放率随时间变化的历史数据，常见形式是两列数字：第一列像时间，第二列像热释放率或相关诊断量。

如果 `input.d` 里类似下面这一项是 `false`：

```text
false                           /read global heat release rate: true/false
```

那么 `heat_release.d` 更多是运行时写出的诊断结果。只有当你明确要从已有全局热释放率历史继续追加，并且把这个读取开关设为 `true` 时，它才会作为已有历史被接续使用。

注意：不要把 `heat_release.d` 当作普通参数表随手改。改坏它通常不会帮你“调燃烧”，反而会让历史诊断不可信。

## 3.13 `mesh5_auto_refine.d`：自动局部加密候选

`mesh5_auto_refine.d` 控制 Mesh-5 自动局部加密候选的评分。它不是“立即让求解器换网格”的开关，而是用几何、涡量、反应速率等指标给可能需要加密的区域打分，生成候选包或报告。

常见内容类似：

```text
enabled = false
on_restart = false
geometry_weight = 0.40
vorticity_weight = 0.30
reaction_weight = 0.30
top_fraction = 0.05
min_fluid_fraction = 0.02
```

意思是：

- `enabled = false`：默认不自动生成候选。
- `geometry_weight`：靠近几何/壁面的评分权重。
- `vorticity_weight`：涡量相关评分权重。
- `reaction_weight`：反应强度相关评分权重。
- `top_fraction`：选取得分靠前的一部分区域。

注意：候选加密只是建议，不是正式生产网格。真正把新网格用于计算，还要经过重启动重映射、预检查和回滚保护流程。新手不要把它当成“一键让结果更准”的按钮。

## 3.14 修改后如何检查

每次改完 `*.d` 文件后，都建议先做检查，再正式运行。下面命令在封装版运行目录执行，也就是能看到 `bin/coastctl` 的目录。

第一步，检查算例配置能不能被读取：

```bash
bin/coastctl case validate --case-dir EXEC.demo --json
```

你应该看到一段 JSON 输出。正常情况不应该出现明显的 `error`、`failed`、`missing` 之类错误。这个检查主要发现文件缺失、格式错误、明显不合法的配置。

第二步，检查边界文件能不能被解析和预览：

```bash
bin/coastctl boundary preview --case-dir EXEC.demo --json
```

这个命令只把预览打印出来，不额外写文件。你应该能看到类似 `COAST_BOUNDARY_PREVIEW_JSON`、`patchCount`、每个 patch 的名字、类型和选择器。

如果你想把预览结果保存到算例目录，便于 图形辅助界面 或别人查看，可以运行：

```bash
bin/coastctl boundary preview --case-dir EXEC.demo --write --json
```

执行后通常会写出 `EXEC.demo/boundary_preview.json`。注意：`--write` 会修改你的工作算例目录，所以不要对 `EXEC_TEMPLATE` 直接运行。

第三步，检查网格状态：

```bash
bin/coastctl mesh status --case-dir EXEC.demo --json
```

你应该关注：

- rank 数量是否和你准备运行的 `mpirun -np` 数量一致；
- 是否找得到需要的网格、分块或 runtime mesh 文件；
- 如果改了几何或网格，是否提示需要重新生成或存在不匹配。

如果你在完整开发工作区，而不是封装版目录，通常可以把 `bin/coastctl` 换成：

```bash
./coastctl case validate --case-dir EXEC --json
./coastctl boundary preview --case-dir EXEC --json
./coastctl mesh status --case-dir EXEC --json
```

## 3.15 不建议新手修改的内容

下面这些不是绝对不能改，而是建议新手不要自己摸索：

- 化学反应机理名称，例如 `arm2`、燃料名称、物种列表。
- `input.d` 里的 LES、PDF、微混合、可压缩模型等核心物理模型。
- `ibm_mesh.d` 里的几何单位、流体/固体标记约定、网格权威来源。
- `mesh_decomposition` 里的 rank 数、强制切分面，除非你知道运行 rank 和 restart 文件怎么匹配。
- `boundary_conditions.d` 里的 `targetMarker`，除非你明确知道目标 marker 对应的数值边界路径。
- `spray.d` 里的喷雾耦合开关，除非这个算例就是喷雾算例。
- `Restart/`、`Decomp/`、`runtime_mesh/` 内部文件。

当前甲烷/ARM2 算例的详细化学生产默认仍是：

```text
chemistry_integrator dvode
chemistry_rhs_backend coast_legacy
chemistry_jacobian_backend internal_finite_difference
chemistry_dvode_mf 22
```

程序内已经有 `generated_sparse_accumulated + mf=21` 对照后端，但 2026-06-26
热态 benchmark 显示它没有带来生产性能收益，因此不要把它作为默认运行设置。
若要做开发对照，先阅读 `SRC.Coast/docs/CHEMISTRY_PERFORMANCE_OPTIMIZATION_GUIDE.md`
和 `EXEC/monitor/chemistry_stage1_benchmark.md`。

遇到不确定的地方，先改一个参数、做一次短测和检查，不要一次改很多项。

# 4. 边界条件设置

边界条件决定“流体从哪里进来、从哪里出去、碰到壁面怎么办”。在 COAST 的 clean EXEC 工作流里，推荐只通过 `boundary_conditions.d` 修改入口、出口和壁面，不要去改 Fortran 源码或旧的入口 profile 文件。

## 4.1 入口、出口、壁面是什么

可以先用生活化方式理解：

- 入口 `inlet`：流体进入计算区域的地方。你需要告诉 COAST 速度、温度、压力参考值、气体组分，例如空气入口或甲烷入口。
- 出口 `outlet`：流体离开计算区域的地方。你通常要给一个出口压力，并说明如果局部出现回流，用什么温度和组分作为参考。
- 壁面 `wall`：固体边界。你需要说明壁面速度是否为零、是否绝热、是否固定温度、是否使用 wall function。

一个燃烧室算例通常至少有：

- 一个或多个空气入口；
- 一个或多个燃料入口；
- 一个出口；
- 外壁和内部几何壁面。

## 4.2 `boundary_conditions.d` 的基本结构

`boundary_conditions.d` 由一组 `patch` 组成。每个 patch 描述一类边界区域，比如 `main_air`、`methane_ring`、`outlet`、`external_adiabatic_walls`。

最小结构如下：

```text
version 1;

patch main_air
{
  kind inlet;
  type fixedVelocityInlet;
  enabled true;
  allowEmpty false;
  priority 10;

  selector
  {
    source externalBoundary;
    side west;
    marker any;
    region all;
  }

  targetMarker -1;
  U fixedValue (0 8.0 0);
  T fixedValue 295;
  p fixedValue 100000;

  composition volumeFraction
  {
    O2 0.21;
    N2 0.79;
    normalize true;
  }
}
```

逐项解释：

- `version 1;`：边界文件格式版本。
- `patch main_air`：定义一个名为 `main_air` 的边界块。名字要唯一。
- `kind inlet;`：这是入口。还可以是 `outlet` 或 `wall`。
- `type fixedVelocityInlet;`：入口类型，这里表示直接给定速度。
- `enabled true;`：启用这个 patch。设为 `false` 相当于暂时停用。
- `allowEmpty false;`：不允许这个 patch 一个面都选不到。入口和出口通常应该保持 `false`。
- `priority 10;`：优先级。多个 patch 重叠时，优先级高的后应用，可以覆盖低优先级 patch。
- `selector { ... }`：选择哪些边界面属于这个 patch。
- `targetMarker -1;`：选中后写入的 COAST marker。它影响求解器使用哪条边界处理路径。
- `U`：速度，单位 m/s。
- `T`：温度，单位 K。
- `p`：压力，单位 Pa。
- `composition`：气体组分。

注意：大多数行末尾要有分号 `;`。漏掉分号、花括号不配对，是最常见的格式错误。

## 4.3 `selector`：边界到底选哪一块

`selector` 是边界文件里最容易写错、也最重要的部分。它回答一个问题：这个 patch 应该应用到哪些网格边界面？

常见字段如下：

| 字段 | 作用 | 常见写法 |
| --- | --- | --- |
| `source` | 从哪里选面 | `externalBoundary`、`ibmSurface` |
| `side` | 在哪一侧边界或网格侧面 | `west`、`east`、`left`、`right`、`south`、`north`、`all` |
| `marker` / `markers` | 原来的 legacy marker 必须是什么 | `marker -1;`、`markers (-5 -50);`、`marker any;` |
| `region` | 在选中侧面上再按几何区域筛选 | `all`、`box`、`cylinderRing` |
| `patchGeometry` | 使用额外 patch STL 文件辅助识别 | `patchGeometry 'Geometry/patches/air_inlet_ymin.stl';` |
| `patchTriangles` | 使用已识别的三角片编号 | 通常由 图形界面 或 sidecar 生成 |
| `cadFaceIds` | 使用 CAD/B-rep 面编号 | 需要可靠 CAD face id |

`source externalBoundary` 表示外部计算域边界，例如整个入口平面、出口平面、外壳边界。

`source ibmSurface` 表示 IBM 几何附近已经存在的流体相邻壁面，例如 STL 内部几何上被识别出的喷口或壁面。它不能凭空创建开口。

`side` 的名字来自网格生成和算例约定，不要只按地图方位猜。当前某些 GTMC 类算例的注释里会写明 `side west` 是低 `y` 入口，`side east` 是高 `y` 出口；另一个算例可能不同。最可靠的方法是看现有 `boundary_conditions.d` 注释、网格预览和边界预览。

`marker any` 表示“不要求原 marker 是某个值”。它很方便，但也危险。只有在坐标范围很窄、`source` 和 `side` 已经足够明确时才建议使用。否则一个 patch 可能选到不该选的面。

## 4.4 坐标选择边界和 patch/STL 边界有什么区别

COAST 支持两类常见边界选择方式。

第一类是 patch/STL 或 CAD 标记选择。它依赖额外几何标签，例如：

```text
patchGeometry 'Geometry/patches/air_inlet_ymin.stl';
```

这表示“用这个小 STL 文件标记空气入口区域”。如果几何提供得很好，这种方式直观，图形辅助界面 也更容易把对应区域展示出来。

类似地，CAD/B-rep 网格可以使用：

```text
cadFaceIds (43);
```

这表示使用 CAD 面编号。只有当 `runtime_mesh/cad_faces.dat` 或几何说明明确告诉你 face id 对应哪个物理边界时，才应该这么写。

第二类是坐标选择。它不依赖 patch STL，而是用边界侧面、坐标范围、半径范围来选。例如：

```text
selector
{
  source externalBoundary;
  side west;
  marker any;
  region cylinderRing;
  axis y;
  center (0 0);
  radiusRange (0.0 0.03);
  axialCoordinate y;
  axialRange (-1.0e30 1.0e30);
}
```

这表示在 `west` 侧外部边界上，选择绕 `y` 轴的一个圆形区域，半径从 `0` 到 `0.03` 米。

两者的区别可以这样记：

| 方式 | 依赖什么 | 优点 | 风险 |
| --- | --- | --- | --- |
| patch/STL 或 CAD face | 可靠的几何标签、patch STL、CAD face id | 物理含义清楚，适合 图形界面 点选 | 标签缺失、路径错误、face id 变化时会选空 |
| 坐标选择 | 坐标轴、边界侧面、半径或盒子范围 | 不需要 patch STL，适合 STL 没有标签的算例 | 坐标轴、单位、范围写错会选错或选空 |

注意：patch STL 是“辅助标记”，不是必须条件。没有 patch STL 时，坐标选择是受支持的正式写法。

## 4.5 没有 patch STL 时如何按坐标设置

当算例只有一个整体 STL，没有单独的入口/出口 patch STL 时，可以按下面步骤写边界。

第一步，确定边界属于外部边界还是 IBM 表面：

- 域外侧入口、域外侧出口、外边框壁面：通常用 `source externalBoundary`。
- STL 内部几何表面、浸入边界附近的喷口或壁面：可能用 `source ibmSurface`。

第二步，确定 `side`。如果是外部边界，必须尽量明确写出哪一侧。不要一开始就对入口/出口用 `side all`。`side all` 更适合“所有外壁”这种壁面 patch。

第三步，选择几何区域。

选择整块侧面：

```text
region all;
```

选择一个长方体范围：

```text
region box;
bounds (-0.01 0.01 -0.02 0.02 -0.005 0.005);
```

`bounds` 六个数依次是：

```text
(xmin xmax ymin ymax zmin zmax)
```

选择圆、圆环或喷口环：

```text
region cylinderRing;
axis y;
center (0 0);
radiusRange (0.0069 0.0081);
axialCoordinate y;
axialRange (-0.00825 -0.00775);
```

这里 `axis y` 表示圆环的轴向是 `y`，半径在垂直于 `y` 的平面里计算。`center (0 0)` 表示这个径向平面里的圆心坐标。对于 `axis y`，半径通常由 `x` 和 `z` 算出来。

第四步，设置 `allowEmpty`。

入口和出口建议：

```text
allowEmpty false;
```

这样如果选不到任何边界面，检查阶段会提醒你，而不是静悄悄跑错。

只有某些可选壁面 patch 才可以：

```text
allowEmpty true;
```

第五步，预览。没有 patch STL 的坐标选择也可以预览：

```bash
bin/coastctl boundary preview --case-dir EXEC.demo --write --json
```

输出里应该能看到：

- `nonPatchStlCoordinateSelectorsSupported` 为 `true`；
- 每个 patch 的 `name`、`kind`、`type`；
- `selector` 中的坐标规则；
- 如果已有网格检查数据，可能还会看到 `matchedFaces`、`empty`、`area`、`averageNormal`。

## 4.6 速度、温度、压力和组分怎么写

### 速度 `U`

速度单位是 m/s，三维向量写成：

```text
U fixedValue (0 8.0 0);
```

三个数字分别是 `x`、`y`、`z` 方向速度。上面表示速度沿正 `y` 方向，大小 8 m/s。

如果流向是负方向，就写负数：

```text
U fixedValue (0 -8.0 0);
```

注意：入口速度方向必须和算例坐标一致。不要只看“左边进、右边出”，要确认实际轴向是 `x`、`y` 还是 `z`。

某些 IBM 入口可以使用模型速度方向，例如：

```text
U model wallNormalIntoFluid;
U fixedValue (1 0 0);
```

在固定速度入口中，这类写法表示速度方向由壁面法向决定，`fixedValue`
主要提供速度大小。在质量流量入口中，速度大小由 `massFlowRate` 自动换算，
`fixedValue` 只需要是非零方向种子。新手不要随意把普通入口改成这种模型，
除非现有算例已经这么写，或者开发者明确要求。

### 温度 `T`

温度单位是 K，也就是开尔文：

```text
T fixedValue 295;
```

`295 K` 大约是 22 摄氏度。不要把摄氏温度直接写进去。例如想写 25 摄氏度，应写约 `298`，不是 `25`。

### 压力 `p`

压力单位是 Pa：

```text
p fixedValue 100000;
```

`100000 Pa` 大约是一标准大气压。入口里的 `p` 常作为参考压力；出口里的 `p` 通常更关键，因为它控制开放边界的压力参考。

### 组分 `composition`

对普通用户，推荐用体积分数：

```text
composition volumeFraction
{
  O2 0.21;
  N2 0.79;
  normalize true;
}
```

这表示空气中氧气体积分数 21%，氮气 79%。`normalize true` 表示允许程序把比例归一化，避免因为小数误差导致总和不是 1。

纯甲烷可以写：

```text
composition volumeFraction
{
  CH4 1.0;
  normalize true;
}
```

也支持质量分数：

```text
composition massFraction
{
  CH4 0.055;
  O2  0.220;
  N2  0.725;
  normalize true;
}
```

注意：物种名区分大小写，必须和当前化学机理一致。当前甲烷/ARM2 算例常见有效气相物种是：

```text
CH4 O2 N2 CO2 CO H2O H2 OH O H
```

不能写成 `ch4`、`o2`、`Nitrogen`、`AIR`。如果机理里没有这个物种，运行会在检查或启动阶段失败。

## 4.7 甲烷/空气边界示例

下面是一个简化的甲烷/空气示例，重点展示写法。真实算例应以自己的坐标、半径、side 和现有文件注释为准。

假设：

- 主流方向是正 `y`；
- 空气从低 `y` 外部边界进入；
- 甲烷从一个 IBM 几何圆环喷入；
- 出口在高 `y` 外部边界；
- 空气温度和甲烷温度都是 `295 K`；
- 参考压力是 `100000 Pa`。

```text
version 1;

patch main_air
{
  kind inlet;
  type fixedVelocityInlet;
  enabled true;
  allowEmpty false;
  priority 10;

  selector
  {
    source externalBoundary;
    side west;
    marker any;
    region cylinderRing;
    axis y;
    center (0 0);
    radiusRange (0.0 0.03);
    axialCoordinate y;
    axialRange (-1.0e30 1.0e30);
  }

  targetMarker -1;
  U fixedValue (0 8.0 0);
  T fixedValue 295;
  p fixedValue 100000;

  composition volumeFraction
  {
    O2 0.21;
    N2 0.79;
    normalize true;
  }
}

patch methane_ring
{
  kind inlet;
  type fixedVelocityInlet;
  enabled true;
  allowEmpty false;
  priority 20;

  selector
  {
    source ibmSurface;
    side all;
    marker any;
    region cylinderRing;
    axis y;
    center (0 0);
    radiusRange (0.0069 0.0081);
    axialCoordinate y;
    axialRange (-0.00825 -0.00775);
  }

  targetMarker -1;
  U model wallNormalIntoFluid;
  U fixedValue (40.0 0 0);
  T fixedValue 295;
  p fixedValue 100000;

  composition volumeFraction
  {
    CH4 1.0;
    normalize true;
  }
}

patch outlet
{
  kind outlet;
  type relaxedPressureOutlet;
  enabled true;
  allowEmpty false;
  priority 10;

  selector
  {
    source externalBoundary;
    side east;
    marker any;
    region all;
  }

  targetMarker -2;
  p fixedValue 100000;

  backflow
  {
    normalFraction 0.1;
    tangentialDamping 0.8;
    scalarBlend 0.1;
    T fixedValue 295;

    composition volumeFraction
    {
      O2 0.21;
      N2 0.79;
      normalize true;
    }
  }
}

patch external_adiabatic_walls
{
  kind wall;
  type noSlipAdiabaticWall;
  enabled true;
  priority 5;

  selector
  {
    source externalBoundary;
    side all;
    markers (-5 -50);
    region all;
  }

  targetMarker -5;
  U fixedValue (0 0 0);
  thermal adiabatic;
  species zeroGradient;
}
```

这个例子里有两个入口：

- `main_air` 是空气入口，优先级 `10`；
- `methane_ring` 是甲烷圆环入口，优先级 `20`，如果它和更宽的空气区域重叠，会后应用。

注意：示例里的 `side west/east`、半径和 `y` 范围不是通用常数。换算例时必须根据几何和预览调整。

## 4.8 常见入口类型

已知速度时，用 `fixedVelocityInlet`：

```text
kind inlet;
type fixedVelocityInlet;
U fixedValue (0 8.0 0);
T fixedValue 295;
p fixedValue 100000;
```

已知总质量流量时，可以用 `massFlowInlet`：

```text
kind inlet;
type massFlowInlet;
massFlowRate fixedValue 0.06;
U fixedValue (0 1 0);
T fixedValue 295;
p fixedValue 100000;
```

压力驱动入口可以用 `totalPressureInlet`：

```text
kind inlet;
type totalPressureInlet;
totalPressure fixedValue 101325;
U fixedValue (0 1 0);
T fixedValue 295;
```

新手优先使用现有算例已经使用的入口类型。如果原文件用的是 `fixedVelocityInlet`，只想改速度大小，就不要顺手改成别的类型。

## 4.9 常见出口类型

可压缩燃烧算例常用较稳妥的放松压力出口：

```text
kind outlet;
type relaxedPressureOutlet;
targetMarker -2;
p fixedValue 100000;
```

如果使用固定静压出口，可能看到：

```text
kind outlet;
type pressureOutlet;
targetMarker -60;
p fixedValue 100000;
```

出口还常带有 `backflow` 块。它的意思是：如果出口局部出现回流，COAST 需要知道回流空气或气体的参考温度和组分。例如：

```text
backflow
{
  normalFraction 0.1;
  tangentialDamping 0.8;
  scalarBlend 0.1;
  T fixedValue 295;
  composition volumeFraction
  {
    O2 0.21;
    N2 0.79;
    normalize true;
  }
}
```

新手一般只需要确认 `p`、`T` 和回流组分合理，不要随意改阻尼系数。

## 4.10 常见壁面类型

绝热无滑移壁面：

```text
kind wall;
type noSlipAdiabaticWall;
targetMarker -5;
U fixedValue (0 0 0);
thermal adiabatic;
species zeroGradient;
```

可以理解为固体墙不动，流体在墙上速度为 0，墙面不主动给热也不带走热。

固定温度无滑移壁面：

```text
kind wall;
type noSlipIsothermalWall;
targetMarker -4;
U fixedValue (0 0 0);
thermal isothermal;
T fixedValue 500;
species zeroGradient;
```

可以理解为墙不动，墙温固定为 `500 K`。

IBM wall function 壁面：

```text
kind wall;
type wallFunctionAdiabaticWall;
selector
{
  source ibmSurface;
  region all;
}
targetMarker -5;
U model wallFunction;
thermal adiabatic;
species zeroGradient;
wallFunction
{
  enabled true;
  dampingEnabled true;
  targetCfl 0.01;
  maxMultiplier 20;
}
```

这类壁面通常是为了复杂几何和高雷诺数近壁处理准备的。新手不要删除现有 `ibm_wall_function`，除非你明确知道这个算例不再使用 IBM 壁面。

## 4.11 边界预览和 图形界面 辅助文件

改完 `boundary_conditions.d` 后，先运行：

```bash
bin/coastctl boundary preview --case-dir EXEC.demo --json
```

如果只想看终端输出，用上面这个命令就够了。

如果要让 图形辅助界面 或其他工具读取预览文件，运行：

```bash
bin/coastctl boundary preview --case-dir EXEC.demo --write --json
```

执行后会在算例目录写出类似：

```text
EXEC.demo/boundary_preview.json
```

预览中重点看：

- `patchCount` 是否等于你期望的 patch 数量；
- 每个 patch 的 `name` 是否唯一；
- `kind` 和 `type` 是否符合物理含义；
- `patchGeometryExists` 如果是 `false`，说明 `patchGeometry` 指向的 STL 文件不存在；
- `empty` 如果是 `true`，说明该 patch 没选到面；
- `matchedFaces` 如果为 `0`，通常说明选择器坐标、side、marker 或几何标签有问题；
- `area` 和 `averageNormal` 是否大致符合入口/出口面积和方向预期。

图形辅助界面 半自动边界流程还可能使用 sidecar：

```bash
bin/coastctl boundary sidecar --case-dir EXEC.demo --write --json
```

这个命令会生成：

```text
EXEC.demo/boundary_patch_manifest.json
```

它是 图形界面 和边界 DSL 之间的中间格式。通常用户不需要手写它。

如果从 sidecar 生成边界草稿，可以运行：

```bash
bin/coastctl boundary write-dsl --case-dir EXEC.demo --json
```

默认会写成 `boundary_conditions.generated.d`，不会直接覆盖当前 `boundary_conditions.d`。只有明确要替换时才使用 `--apply`；使用 `--apply` 时工具会先备份原文件。

注意：自动生成的草稿也需要人工检查速度、温度、压力、组分和坐标范围，不能生成后直接投入正式计算。

## 4.12 修改边界后的完整检查顺序

建议按这个顺序：

1. 保存 `boundary_conditions.d`。
2. 做边界预览。
3. 做算例配置检查。
4. 做网格状态检查。
5. 做很短步数的试运行。

前三个命令是：

```bash
bin/coastctl boundary preview --case-dir EXEC.demo --write --json
bin/coastctl case validate --case-dir EXEC.demo --json
bin/coastctl mesh status --case-dir EXEC.demo --json
```

如果出现错误，先不要运行求解器。优先修正边界文件和网格状态。

短测时，可以先把 `input.d` 里的 `lstep` 改小，例如 20 到 50 步。短测能启动、日志没有明显边界错误、Visit 输出能打开，再恢复正式步数。

## 4.13 常见错误和修正

### 错误 1：patch 一个面都选不到

表现：

- 预览里 `empty` 为 `true`；
- `matchedFaces` 为 `0`；
- 运行启动时报边界为空。

常见原因：

- `side` 写错；
- `source externalBoundary` 和 `source ibmSurface` 用反了；
- 半径或坐标范围太窄；
- STL 单位是 mm，但你按 m 以外的尺度理解了坐标；
- `marker` 限制太严格；
- `patchGeometry` 路径不存在。

修正方法：

- 先把 `patchGeometry` 路径检查清楚；
- 对照网格预览确认入口/出口在哪个 side；
- 适度放宽坐标范围；
- 如果确实不知道原 marker，可在很窄坐标范围里临时用 `marker any`；
- 不要为了消除错误直接把入口 `allowEmpty` 改成 `true`。

### 错误 2：入口方向写反

表现：

- 入口附近速度从域内往外跑；
- 质量流量方向不对；
- 火焰或混合区位置明显异常。

修正方法：

- 确认主流方向是 `x`、`y` 还是 `z`；
- 正方向用正数，负方向用负数；
- 对 IBM 法向入口，优先沿用原文件中的 `U model wallNormalIntoFluid` 写法。

### 错误 3：温度单位写成摄氏度

错误写法：

```text
T fixedValue 25;
```

正确写法：

```text
T fixedValue 298;
```

COAST 这里使用 K。温度写得过低会导致密度、反应和稳定性都不合理。

### 错误 4：物种名写错

错误写法：

```text
composition volumeFraction
{
  ch4 1.0;
  normalize true;
}
```

正确写法：

```text
composition volumeFraction
{
  CH4 1.0;
  normalize true;
}
```

物种名区分大小写。当前甲烷/ARM2 常用 `CH4`、`O2`、`N2`，不是 `ch4`、`oxygen`、`air`。

### 错误 5：组分总和不合理

如果使用：

```text
normalize false;
```

那么组分总和应非常接近 1。新手建议使用：

```text
normalize true;
```

这样写 `O2 21; N2 79;` 这类比例时也能被归一化，但仍建议直接写成 `0.21` 和 `0.79`，更清楚。

### 错误 6：patch 优先级导致覆盖关系反了

例如一个大空气入口覆盖整个入口面，小甲烷环位于其中。如果空气 patch 优先级更高，它可能把甲烷环覆盖掉。

修正方法：

- 大范围 patch 用较低优先级，例如 `priority 10;`；
- 小范围、需要覆盖的 patch 用较高优先级，例如 `priority 20;`；
- patch 名字要唯一。

### 错误 7：把边界文件当成开洞工具

`boundary_conditions.d` 只能选择已经存在的流体边界面并赋值。它不能把固体单元变成流体，也不能在 STL 壁面上凭空开一个新喷口。

如果你需要新增内部入口或出口，通常要改的是网格/IBM 设置，例如几何、开口面、强制分块平面等。这属于 `ibm_mesh.d` 和网格生成流程，不是单独改边界 patch 能解决的。

### 错误 8：`targetMarker` 随便改

`targetMarker` 看起来只是一个数字，但它会影响 COAST 内部采用哪条边界处理路径。常见约定包括：

- `-1`：常见固定入口路径；
- `-2` 或 `-60`：常见出口路径，具体用哪个要看算例；
- `-5`、`-50`：常见绝热/零梯度壁面；
- `-4`、`-40`：常见固定温度壁面；
- `-3`：常见滑移或对称边界。

新手只改速度、温度、压力和组分时，不要顺手改 `targetMarker`。

## 4.14 边界修改前后的自查清单

提交或正式运行前，可以逐项确认：

- 每个 `patch` 名字唯一。
- 每个入口、出口都有 `allowEmpty false`。
- 每个入口有 `U`、`T`、`p`、`composition`。
- 出口压力 `p` 合理，回流 `T` 和组分合理。
- 壁面类型和 `thermal` 对得上，例如绝热壁用 `thermal adiabatic`。
- 速度单位是 m/s，温度单位是 K，压力单位是 Pa。
- 物种名属于当前化学机理。
- 坐标范围单位是米，且和 STL 单位转换后的计算域一致。
- patch/STL 路径存在，或者确认该 patch 是纯坐标选择。
- 小范围 patch 的 `priority` 高于大范围 patch。
- `coastctl boundary preview`、`case validate`、`mesh status` 都没有明显错误。

完成这些检查后，再进入“运行计算”章节做短测和正式计算。


# 5. 运行计算

本章从“准备开算”讲到“正在运行时怎么看”。如果你是第一次使用 COAST，不要急着做很长的正式计算。推荐顺序是：先做运行前检查，再做短测，短测通过后才做正式计算；如果正式计算中断或需要继续，就按续算流程来做。

下面的命令默认在便携包根目录执行，也就是能看到 `bin/coastctl`、`bin/coast-ui`、`EXEC_TEMPLATE` 的那个目录。假设你的工作算例目录叫 `EXEC.demo`。

注意：如果你已经用 `install.sh` 安装过便携版，并且已经执行过 `source "$HOME/.local/coast/env/coast-env.sh"`，命令里的 `bin/coastctl` 可以写成 `coastctl`。如果你还没有安装，只是在解压目录里直接运行，就继续使用 `bin/coastctl`。

## 5.1 开算前先确认自己在哪个目录

COAST 的一次计算不是只运行一个文件，而是读取一个“算例目录”。这个目录里通常有：

- 主求解器由封装目录里的 `bin/coast-solver` 提供；算例目录主要保存输入、网格、重启动数据和输出结果；
- `input.d`：总控制文件，里面有是否读 Restart、总步数、输出频率等；
- `boundary_conditions.d`：入口、出口、壁面等边界条件；
- `ibm_mesh.d`：几何、网格、IBM 相关设置；
- `vtk_output.d`：结果输出字段设置；
- `runtime_mesh/`：运行时网格；
- `Restart/`：续算用的重启动文件；
- `Visit/`：后处理结果文件；
- `screen`：求解器屏幕日志；stdout/stderr 和 run manifest 由 `coastctl` 放在算例外部 `.coast_run_logs/`，具体路径通过 `coastctl monitor` 查看。

如果你是从模板开始，应该先复制 `EXEC_TEMPLATE`，不要直接在模板里计算：

```bash
cp -a EXEC_TEMPLATE EXEC.demo
```

执行位置：便携包根目录。

执行后应该看到：当前目录下多出一个 `EXEC.demo` 文件夹。以后修改、运行、查看结果都针对 `EXEC.demo`，`EXEC_TEMPLATE` 保持原样，方便以后重新创建干净算例。

注意：不要把多个不同任务都放在同一个 `EXEC.demo` 里长期混用。建议每个实验、每个工况都复制一个新的算例目录，例如 `EXEC.case01`、`EXEC.case02`。

## 5.2 运行前检查清单

运行前检查的目的不是“形式上跑几个命令”，而是提前发现最常见的问题：程序不存在、MPI 启不起来、输入文件写错、边界选不到、网格和 Restart 数量不匹配等。正式计算往往很耗时，越早发现问题越省时间。

推荐按下面顺序检查。

### 5.2.1 检查运行环境

```bash
bin/coastctl doctor --case-dir EXEC.demo --json
```

执行位置：便携包根目录。

这个命令会检查：

- 当前目录是不是 COAST 工作区或便携包；
- 算例目录是否存在；
- 主求解器是否可以执行；
- `mpirun` 是否能找到；
- `python3` 是否能找到；
- `boundary_conditions.d` 是否存在；
- `runtime_mesh/` 是否有网格信息；
- `Restart/` 中的 `restart.NNN` 数量是否合理；
- 如果存在 `restart_pdf.NNN`，数量是否和 `restart.NNN` 对得上；
- `Decomp/`、`Restart/`、`runtime_mesh/` 的 rank 数是否明显冲突。

执行后应该看到：一段 JSON 文本。新手不需要完全读懂 JSON，只要重点看 `"ok": true` 或每个检查项里的 `"ok": true`。如果某项是 `false`，先处理这一项，不要继续开算。

注意：`doctor` 通过不代表物理设置一定正确，它只是先确认“能不能正常启动”和“文件结构有没有明显缺口”。

### 5.2.2 检查输入文件格式

```bash
bin/coastctl case validate --case-dir EXEC.demo --json
```

执行位置：便携包根目录。

这个命令会检查算例直接输入文件是否能被工具识别，尤其适合在你改过 `*.d` 文件之后运行。

执行后应该看到：JSON 中显示检查成功。如果失败，通常是某个文件少了、路径错了、字段格式写错了，或者有工具明确指出的配置问题。先修正，再重新运行这个命令。

### 5.2.3 检查边界条件是否能选到边界

```bash
bin/coastctl boundary preview --case-dir EXEC.demo --write --json
```

执行位置：便携包根目录。

这个命令会读取 `boundary_conditions.d`，生成边界预览文件，一般写到：

```text
EXEC.demo/boundary_preview.json
```

执行后应该看到：每个入口、出口、壁面 patch 都能被解析。重点看有没有明显的空选择、禁用项、拼写错误或坐标范围错误。

注意：边界条件只能给已经存在的边界“指定物理含义”，不能把固体内部硬变成流体入口。如果某个入口选不到，通常要先检查几何、网格或坐标范围，而不是随便把 `kind` 改成别的。

### 5.2.4 检查网格状态

```bash
bin/coastctl mesh status --case-dir EXEC.demo --json
```

执行位置：便携包根目录。

这个命令会总结当前算例的运行时网格，例如网格来源、网格分块数量、几何文件，以及 Restart 和网格之间是否存在需要注意的关系。

执行后应该看到：有 `activeRuntimeMesh` 之类的信息，并且 rank 数、网格文件都不是空的。如果你准备续算，还要特别注意当前 `runtime_mesh/` 是否和 `Restart/runtime_mesh/` 对得上。

### 5.2.5 计划一次运行，但先不真正启动

```bash
bin/coastctl run --case-dir EXEC.demo --ranks 128 --preflight --write --json
```

执行位置：便携包根目录。

这个命令的含义是：按 128 个 rank 计划运行，并做启动前检查，但不真正开始长时间计算。它会把计划和 run-control 状态写到算例外部 `.coast_run_logs/`，不要在 `EXEC.demo` 根目录留下 `.json` 控制文件。具体路径可以通过 `coastctl monitor` 的 `stdoutLog`、`stderrLog` 和 manifest 字段查看：

```text
.coast_run_logs/<case>/<run>/coast_run_plan.json
.coast_run_logs/_state/<case-key>.json
```

执行后应该看到：JSON 中的 `"status": "planned"`，命令里会包含：

```text
mpirun -np 128 ../bin/coast-solver
```

注意：这里的 `128` 只是示例。你的算例应该用多少 rank，要看 `Decomp/`、`Restart/`、`runtime_mesh/` 的分块数量，以及服务器资源。不要因为服务器核心多就随意加大 rank。

如果这个 preflight 需要把旧 `Restart` 准备到新的 `runtime_mesh`，默认会使用 C++ `coast_remap` 后端。只有显式加上 `--remap-backend python-reference` 时才会使用 Python reference；找不到 C++ 后端时不会静默回退。

## 5.3 rank 是什么意思

`rank` 是 MPI 并行计算里的编号，可以简单理解为“把一个大计算分给多少个并行工人”。如果使用 128 个 rank，COAST 通常会启动 128 个并行进程，它们编号为 0 到 127。文件名里常见的三位数字就是这个编号，例如：

```text
Restart/restart.000
Restart/restart.001
...
Restart/restart.127
```

`rank` 不是计算精度等级，也不是越大越好。它和算例分块强相关：

- `Decomp/grid_vv.*` 表示旧式分块信息；
- `runtime_mesh/block_*.dat` 表示运行时网格分块；
- `Restart/restart.NNN` 表示每个 rank 保存的一份续算数据；
- `Visit/solution.<step>.domain.<rank>.vtk` 表示每个 rank 输出的一块结果。

对新手来说，最重要的规则是：

- 第一次运行时，使用模板或算例已经准备好的 rank 数；
- 续算时，尽量使用和写出 Restart 时相同的 rank 数；
- `Restart/restart.NNN` 有多少个，续算时通常就用多少个 rank；
- 如果有 `restart_pdf.NNN`，它的数量必须和 `restart.NNN` 一样；
- 不确定时先运行 `doctor` 和 `mesh status`，不要盲目改 `--ranks`。

例如 `Restart/` 里从 `restart.000` 到 `restart.127` 一共 128 个文件，那么续算时通常应该用：

```bash
bin/coastctl run --case-dir EXEC.demo --ranks 128 --preflight --write --json
```

如果你把它改成 64 或 256，程序可能无法正确读取已有 Restart，轻则启动失败，重则读到不匹配的数据。

## 5.4 Restart 和 PDF Restart 是什么

`Restart` 可以翻译成“重启动”或“续算文件”。它不是给人看的结果图，而是给 COAST 自己以后继续计算用的存档。一次长计算可能要跑很久，中间需要保存状态；下次可以从保存状态继续，而不是从初始时刻重新开始。

COAST 常见的重启动文件有两类。

第一类是流场 Restart：

```text
EXEC.demo/Restart/restart.000
EXEC.demo/Restart/restart.001
...
```

它保存每个 rank 的主要流场数据，例如速度、压力相关状态、温度相关状态等。具体字段新手不需要逐个理解，只要知道它决定了“从哪里接着算”。

第二类是 PDF Restart：

```text
EXEC.demo/Restart/restart_pdf.000
EXEC.demo/Restart/restart_pdf.001
...
```

PDF Restart 和 PDF 方程、燃烧/混合相关的随机场状态有关。可以把它理解成“燃烧和混合模型自己的续算状态”。如果算例启用了对应模型，正式续算时通常也要保存和读取它。

`input.d` 里通常有几组重要开关：

```text
true true                   /restart, write to restart
...
true true                   /read_pdf,write_pdf
```

这类行的具体格式以你的模板为准，但意思大致是：

- `read_restart`：启动时是否读取已有 `Restart/restart.NNN`；
- `write_restart`：运行过程中是否写出新的 `Restart/restart.NNN`；
- `read_pdf`：启动时是否读取已有 `Restart/restart_pdf.NNN`；
- `write_pdf`：运行过程中是否写出新的 `Restart/restart_pdf.NNN`。

常见组合如下。

| 场景 | `read_restart` | `write_restart` | `read_pdf` | `write_pdf` | 说明 |
| --- | --- | --- | --- | --- | --- |
| 从初始条件开始短测 | `false` | `true` | `false` | 视算例而定 | 不读旧状态，但可以写出新 Restart |
| 从已有流场续算，且没有 PDF Restart | `true` | `true` | `false` | `true` | 常见于只有冷态流场 Restart 的情况 |
| 从完整保存状态续算 | `true` | `true` | `true` | `true` | `restart.NNN` 和 `restart_pdf.NNN` 都齐全 |
| 只检查启动，不想覆盖结果 | 先不要正式运行 | 先不要改 | 先不要改 | 先不要改 | 先用 `--preflight` |

注意：如果 `Restart/` 里没有 `restart_pdf.NNN`，就不要把 `read_pdf` 设成 `true`。否则程序会尝试读取不存在的 PDF Restart，通常会启动失败。可以先设为 `read_pdf=false, write_pdf=true`，让程序在新计算中写出新的 PDF Restart；下一次再从这些新文件完整续算。

注意：不要手动只复制一部分 `Restart/restart.NNN`。缺少任何一个 rank 的 Restart，都可能导致续算失败。

## 5.5 短测、正式计算和续算

COAST 的运行建议分三步走：短测、正式计算、续算。三者的区别主要在 `input.d` 的步数、输出频率和是否读取 Restart。

### 5.5.1 短测

短测的目标是确认“算例能启动、能走几步、能写日志、能写 Visit、能写 Restart”。短测不是为了得到最终物理结论。

短测前，打开 `EXEC.demo/input.d`，把步数和输出频率改得小一些。不同模板的注释可能略有不同，但常见关键项是：

```text
10                          /lstep
1                           /stepsave : write restart file interval
1                           /stepplot : write plot file interval
```

意思是：

- `lstep`：最多计算到多少步；
- `stepsave`：每隔多少步写一次 Restart；
- `stepplot`：每隔多少步写一次 Visit/VTK 结果。

短测时可以设成 10 步、20 步或 50 步。为了快速确认输出链路，`stepsave` 和 `stepplot` 可以先设得比较小，例如 1、5 或 10。具体值要结合算例规模，网格很大的算例不建议每一步都写大量结果。

修改后先检查：

```bash
bin/coastctl case validate --case-dir EXEC.demo --json
bin/coastctl boundary preview --case-dir EXEC.demo --write --json
bin/coastctl mesh status --case-dir EXEC.demo --json
bin/coastctl run --case-dir EXEC.demo --ranks 128 --preflight --write --json
```

这些都通过后，再真正启动：

```bash
bin/coastctl run --case-dir EXEC.demo --ranks 128 --execute --preflight --write --json
```

执行位置：便携包根目录。

执行后应该看到：命令很快返回一段 JSON，其中 `"status": "started"`，并在算例外部 `.coast_run_logs/` 写出运行 manifest 和状态文件：

```text
.coast_run_logs/<case>/<run>/coast_run.json
.coast_run_logs/_state/<case-key>.json
```

注意：这个命令启动的是后台计算。命令返回不代表计算已经完成，只代表 COAST 已经开始跑了。后续要用监看命令确认进展。

### 5.5.2 正式计算

短测通过后，才把 `input.d` 改成正式计算需要的步数和输出频率。正式计算通常要注意两件事：

- `lstep` 不要写错数量级；
- `stepsave` 和 `stepplot` 不要太小，否则结果文件可能非常大。

例如：

```text
5000                        /lstep
500                         /stepsave : write restart file interval
500                         /stepplot : write plot file interval
```

这只是示例，不代表所有算例都应该这样设。新手如果没有明确要求，建议先问算例提供者或项目负责人：正式计算要跑多少步、多久保存一次 Restart、多久输出一次 Visit。

正式计算前仍然要执行：

```bash
bin/coastctl doctor --case-dir EXEC.demo --json
bin/coastctl case validate --case-dir EXEC.demo --json
bin/coastctl mesh status --case-dir EXEC.demo --json
bin/coastctl run --case-dir EXEC.demo --ranks 128 --preflight --write --json
```

确认无误后启动：

```bash
bin/coastctl run --case-dir EXEC.demo --ranks 128 --execute --preflight --write --json
```

注意：正式计算期间不要随意编辑 `input.d`、`boundary_conditions.d`、`ibm_mesh.d`、`runtime_mesh/` 或 `Restart/`。这些文件是正在运行的程序依赖的输入和状态，运行中改动可能导致结果不可解释。

### 5.5.3 续算

续算就是从已有 `Restart/` 接着算。续算前先确认：

- 上一次计算已经正常停止，或者至少已经写出完整 Restart；
- `Restart/restart.NNN` 数量和 rank 数一致；
- 如果要读 PDF Restart，`Restart/restart_pdf.NNN` 数量也一致；
- 当前 `runtime_mesh/` 和 Restart 对应的网格没有被随意替换；
- `input.d` 中的 `read_restart` 已打开；
- `lstep` 设置为你希望继续跑到的总步数或后续步数，按当前算例约定执行；
- 先做 `--preflight`，再启动。

常见续算前检查：

```bash
bin/coastctl doctor --case-dir EXEC.demo --json
bin/coastctl mesh status --case-dir EXEC.demo --json
bin/coastctl run --case-dir EXEC.demo --ranks 128 --preflight --write --json
```

启动续算：

```bash
bin/coastctl run --case-dir EXEC.demo --ranks 128 --execute --preflight --write --json
```

执行后，查看 `screen` 或 图形辅助界面 监看页面。如果是完整续算，日志中通常会出现类似“Restarting from previous solution”的提示；如果读取 PDF Restart，也可能出现“Restarting Pdf Equation from Previous Solution”一类提示。

注意：不要为了“节省空间”在续算前删除旧 `Restart/`。如果必须整理空间，先复制整个算例目录或把 `Restart/`、`Visit/` 归档到安全位置，再操作。

## 5.6 使用 coastctl run

`coastctl run` 是推荐的新手运行入口。它帮助你生成运行计划、做启动前检查、启动后台计算，并记录本次运行信息。

### 5.6.1 只生成计划

```bash
bin/coastctl run --case-dir EXEC.demo --ranks 128 --write --json
```

执行位置：便携包根目录。

含义：生成运行计划，但不检查输入、不启动程序。

执行后应该看到：

```text
.coast_run_logs/<case>/<run>/coast_run_plan.json
```

计划里会记录：

- 算例目录；
- rank 数；
- 实际会运行的命令；
- 标准输出日志位置；
- 标准错误日志位置；
- 是否真正执行。

### 5.6.2 做 preflight 检查

```bash
bin/coastctl run --case-dir EXEC.demo --ranks 128 --preflight --write --json
```

含义：启动前先自动做一遍 `case validate`，再写出计划，但不真正运行。

这是正式运行前最推荐的一步。

如果涉及 Restart 重映射，这一步默认检查并调用 C++ `coast_remap` 生产后端。Python reference 只用于显式诊断命令：

```bash
bin/coastctl run --case-dir EXEC.demo --ranks 128 \
  --preflight --remap-backend python-reference --write --json
```

### 5.6.3 真正启动计算

```bash
bin/coastctl run --case-dir EXEC.demo --ranks 128 --execute --preflight --write --json
```

含义：先做 preflight，通过后在 `EXEC.demo` 目录里启动：

```text
mpirun -np 128 ../bin/coast-solver
```

`stdout` 会写入外置运行目录：

```text
.coast_run_logs/<case>/<run>/stdout.log
```

`stderr` 会写入外置运行目录：

```text
.coast_run_logs/<case>/<run>/stderr.log
```

运行信息会写入外置运行目录和外置状态索引：

```text
.coast_run_logs/<case>/<run>/coast_run.json
.coast_run_logs/_state/<case-key>.json
```

注意：如果已经有一个运行中的 COAST，`coastctl run` 通常会拒绝再次启动，避免同一个算例目录里同时跑两个程序。不要用多个终端重复点击“开始运行”。

### 5.6.4 如果不用 coastctl，底层命令是什么

有些开发者或老脚本会直接在算例目录里运行：

```bash
cd EXEC.demo
mkdir -p ../.coast_run_logs/manual
mpirun -np 128 ../bin/coast-solver \
  > ../.coast_run_logs/manual/EXEC.demo.stdout.log \
  2> ../.coast_run_logs/manual/EXEC.demo.stderr.log
```

这是普通手工低层启动方式；源码版等价命令是 `cd EXEC && mpirun -np N ./coast`。如果 MPI size differs from the active runtime mesh rank count，且 `input.d` 和 Mesh-5 配置允许 startup regrid / restart remap，启动阶段会在 solver reads fields 之前走受控 preflight/write/remap 路径。若 preconditions fail，例如 rank、文件数量、mesh identity、remap 后端或门禁条件不满足，应失败关闭并在 `screen` / JSON 诊断中说明原因。

新手和生产算例更推荐使用 `coastctl run`，因为它会记录计划、检查已有运行、统一日志位置，并在需要时通过 C++ `coast_remap` 完成 prepare/remap/activation。

注意：direct `mpirun` 也不应该把 `.log`、`.json`、`.pid` 或 session 临时文件留在 `EXEC.demo` 根目录。需要临时重定向 stdout/stderr 时，放到算例外部的 `.coast_run_logs/`、临时目录或用户指定归档目录。

注意：不要在没有步数限制的情况下直接运行长算例。运行前必须确认 `input.d` 里的 `lstep`、`stepsave`、`stepplot` 是你想要的值。

## 5.7 可选辅助：用图形辅助界面监看运行

图形辅助界面 是给新手使用的图形界面，可以在浏览器中查看算例状态、编辑输入、启动运行、停止运行、查看 Visit 输出和做基础后处理。

### 5.7.1 启动 图形辅助界面

在 Linux 服务器上，进入便携包根目录，执行：

```bash
bin/coast-ui --workspace "$PWD" --case-dir "$PWD/EXEC.demo" --host 127.0.0.1 --port 18765
```

执行后应该看到：终端里显示 图形辅助界面 服务正在运行，并占用 `127.0.0.1:18765`。

如果你在 Windows 电脑上使用浏览器访问远程 Linux 服务器，需要在 Windows PowerShell 里做端口转发：

```powershell
ssh -N -L 18765:127.0.0.1:18765 user@server
```

把 `user@server` 换成你的服务器用户名和地址。这个 PowerShell 窗口要保持打开。然后在 Windows 浏览器打开：

```text
http://127.0.0.1:18765
```

注意：`127.0.0.1` 是“本机”的意思。在服务器命令里，它指服务器自己；在 Windows 浏览器里，它指 Windows 自己。端口转发的作用，就是把 Windows 的 `127.0.0.1:18765` 接到服务器的 `127.0.0.1:18765`。

### 5.7.2 图形辅助界面 里怎么看运行

图形辅助界面 的运行监看通常会调用：

```bash
bin/coastctl monitor --case-dir EXEC.demo --json
```

它会读取：

```text
EXEC.demo/screen
.coast_run_logs/<case>/<run>/stdout.log
.coast_run_logs/<case>/<run>/stderr.log
```

你可以关注几类信息：

- 当前是否有 `screen` 文件；
- 最后识别到的 step 或 `istep`；
- 外部 `stdout.log` 和 `stderr.log` 是否持续增长；
- 是否出现 `fatal`、`mpi error`、`abort`、`NaN`、`Inf` 等错误摘要；
- `Visit/` 中是否有新的结果文件；
- `Restart/` 中是否有新的续算文件。

如果不用 图形辅助界面，也可以在服务器终端执行：

```bash
bin/coastctl monitor --case-dir EXEC.demo --json
```

或者看最近的屏幕日志：

```bash
tail -80 EXEC.demo/screen
```

执行位置：便携包根目录。

注意：`tail -80` 只是看最后 80 行，不会修改任何文件。它适合快速查看程序跑到哪里了。

## 5.8 温和停止

温和停止的意思是：不要直接杀死程序，而是告诉 COAST “请在合适的位置停下来，并尽量写出应写的文件”。这样比强制断电或直接杀进程更安全。

推荐命令：

```bash
bin/coastctl stop --case-dir EXEC.demo --json
```

执行位置：便携包根目录。

这个命令会在算例目录里创建：

```text
EXEC.demo/stop_coast
```

COAST 主程序会在运行过程中检查这个文件。如果发现它存在，就会尝试在合适的时间停止，并写出相应输出。

执行后应该看到：JSON 中显示 `createdStopFile` 为 `true`，并给出 `stopFile` 路径。

停止后继续监看：

```bash
bin/coastctl monitor --case-dir EXEC.demo --json
tail -80 EXEC.demo/screen
```

如果日志里出现类似 `stop_coast`、`time > tlast or istep > lstep: stop`、`finished`、保存 Restart 的提示，说明程序正在或已经按正常流程停止。

注意：温和停止不是“立刻消失”。大算例可能要等当前步或当前输出完成后才停。不要在几秒钟内连续乱按停止和启动。

如果温和停止很久没有反应，并且你确认必须结束，可以使用强制停止：

```bash
bin/coastctl stop --case-dir EXEC.demo --force --json
```

注意：`--force` 会尝试给运行进程发送终止信号，风险比温和停止高。强制停止后要检查 `Restart/` 是否完整，不能默认最后一次结果可续算。

## 5.9 哪些提示说明失败了

下面这些现象通常说明运行失败或至少需要暂停检查：

- `coastctl run` 报 `mpirun not found`；
- `coastctl run` 报 `missing executable`；
- `coastctl run` 报已有运行正在 active；
- `coastctl monitor` 的 `errorSummary` 不为空；
- 外部 `stderr.log` 持续增长，并出现 `MPI error`、`abort`、`fatal`；
- `screen` 中出现 `NaN`、`Inf`、`infinity`；
- `screen` 中出现 `Segmentation fault`；
- 日志提示无法打开 `restart` 或 `restart_pdf` 文件；
- 日志提示边界配置错误；
- `Visit/` 长时间没有新文件，`screen` 也不再更新；
- 程序很快退出，但没有写出预期的 Visit 或 Restart；
- 续算时没有出现读取 Restart 的提示。

遇到这些情况，先不要反复重启。按第 7 章的排查顺序收集信息。

# 6. 查看和导出结果

COAST 的计算结果主要放在 `Visit/` 目录。这里的 Visit 指的是 VisIt 后处理软件，不是英文“访问”的意思。COAST 会输出 VisIt 可以读取的索引文件和 VTK 数据文件，帮助你查看切片、三维整体、云图、等值线和矢量图。

## 6.1 `Visit/solution.visit` 和分块 VTK 文件是什么

一次计算结束或输出时，常见结果文件在：

```text
EXEC.demo/Visit/
```

其中最重要的入口文件通常是：

```text
EXEC.demo/Visit/solution.visit
```

它不是完整数据本身，而像一个“目录清单”。里面列出 VisIt 应该读取哪些 VTK 文件。

真正的大量数据通常在类似这些文件里：

```text
EXEC.demo/Visit/solution.00000500.domain.000.vtk
EXEC.demo/Visit/solution.00000500.domain.001.vtk
...
EXEC.demo/Visit/solution.00000500.domain.127.vtk
```

可以这样理解：

- `solution`：这是求解结果；
- `00000500`：通常表示第 500 步或某个输出步编号；
- `domain.000`：第 0 个 rank 或第 0 个分块；
- `.vtk`：一种后处理数据格式，VisIt 可以打开。

如果一个算例用 128 个 rank 计算，那么同一个输出步可能对应 128 个 `.vtk` 文件。VisIt 通过 `.visit` 文件把这些分块拼成一个整体来看。

## 6.2 为什么 `.visit` 不能单独发给别人

`.visit` 文件通常很小，因为它只是一份索引清单。它里面可能只是写着：

```text
solution.00000500.domain.000.vtk
solution.00000500.domain.001.vtk
...
```

如果你只把 `solution.visit` 发给别人，而没有把这些 `.vtk` 文件一起发过去，对方打开时就会发现数据缺失。就像你把一本书的目录发给别人，但没有发正文。

正确分享方式是：

- 发送 `solution.visit`；
- 同时发送它引用的所有 `solution.<step>.domain.<rank>.vtk`；
- 保持相对路径不变，最好仍然放在同一个 `Visit/` 文件夹里；
- 如果有多个输出步，要确认每个输出步对应的 `.visit` 和 `.vtk` 都齐全；
- 最推荐使用 图形辅助界面 的 Visit 打包下载功能，让系统自动把相关文件打成一个 zip。

注意：不要手动只挑几个 `.vtk` 文件发，除非你非常清楚自己只想看某几个分块。普通后处理和归档都应该保留完整分块。

## 6.3 可选辅助：用图形辅助界面下载 Visit 文件

图形辅助界面 会扫描 `Visit/` 目录，把 `.visit` 和 `.vtk` 按数据组归类。它内部会把同一组结果一起打包成 zip，避免你漏选文件。

操作思路如下：

1. 启动 图形辅助界面；
2. 在浏览器打开 `http://127.0.0.1:18765`；
3. 找到结果、Visit、后处理或下载相关页面；
4. 查看每组数据的 `.visit` 数量、`.vtk` 数量和总大小；
5. 选择需要的数据组下载；
6. 下载得到类似 `coast_solution...zip` 的压缩包；
7. 解压后保持 `Visit/` 目录结构，再用 VisIt 打开里面的 `.visit` 文件。

图形辅助界面 对应的下载逻辑会把选中组里的 `.visit` 和 `.vtk` 一起放进 zip。如果选择全部结果，文件可能很大，要先确认本地磁盘空间够用。

注意：如果 图形辅助界面 显示 `vtkCount` 为 0，说明它没有找到对应 VTK 数据。此时下载 `.visit` 没有意义，应该先检查计算是否真的写出了结果。

## 6.4 下载和安装 VisIt

VisIt 是一个常用的科学可视化软件，可以打开 COAST 输出的 `.visit` 和 `.vtk` 文件。你可以在 VisIt 官方网站下载：

```text
https://visit-dav.github.io/visit-website/
```

新手安装建议：

- Windows 用户下载 Windows 版本安装包；
- Linux 用户可以使用系统包管理器、集群已安装版本，或官网下载版本；
- 如果是在服务器上通过 图形辅助界面 自动生成图片，服务器上也需要能找到 `visit` 命令；
- 如果服务器上 VisIt 不在默认路径，可以让管理员设置 `COAST_VISIT_BIN` 指向 VisIt 可执行文件。

在服务器上检查是否能找到 VisIt：

```bash
which visit
```

如果这个命令有输出，例如 `/usr/local/bin/visit`，说明系统能找到 VisIt。若没有输出，图形辅助界面 的自动后处理可能会提示找不到 VisIt。

注意：本地电脑安装 VisIt 是为了自己打开下载的数据；服务器安装 VisIt 是为了让 图形辅助界面 在服务器上自动生成图片。两者用途不同。

## 6.5 在 VisIt 中打开 COAST 结果

以 Windows 本地查看为例：

1. 从 图形辅助界面 下载 Visit zip；
2. 解压到一个没有中文特殊符号、路径不要太深的目录，例如 `D:\coast_results\case01`；
3. 打开 VisIt；
4. 选择 `File` -> `Open file`；
5. 找到解压目录里的 `Visit/solution.visit`；
6. 打开后，在 VisIt 中选择要显示的变量和绘图方式；
7. 点击 `Draw` 或类似按钮绘图。

如果 VisIt 提示找不到某些 `.vtk` 文件，通常是因为：

- 只复制了 `.visit`，没有复制 `.vtk`；
- 解压时改变了目录结构；
- 文件名被网盘或聊天软件改了；
- 某些 `.vtk` 没下载完整；
- `.visit` 文件引用的是相对路径，但你把它和 `.vtk` 分开放了。

解决方法：重新用 图形辅助界面 打包下载完整组，解压后不要移动单个文件。

## 6.6 常见后处理图的含义

新手第一次打开 VisIt 时，最容易被各种 plot 类型吓到。先掌握下面几种就够了。

### 6.6.1 Pseudocolor：伪彩色云图

伪彩色图就是把某个标量字段用颜色表示。例如温度高的地方显示红色，温度低的地方显示蓝色。它适合查看：

- 温度分布；
- 压力分布；
- 密度分布；
- 组分浓度；
- 反应进度；
- IBM 或边界标记。

操作思路：

1. 添加 `Pseudocolor` 图；
2. 选择一个标量字段；
3. 如果内部结构看不清，添加 `Slice` 切片；
4. 点击绘制。

### 6.6.2 Slice：切片

切片就是从三维结果中切出一个平面来看。它适合查看内部流场，因为三维整体可能被外表面挡住。

常见切片方向：

- `slice_x`：垂直于 x 方向的切片；
- `slice_y`：垂直于 y 方向的切片；
- `slice_z`：垂直于 z 方向的切片。

图形辅助界面 自动后处理里通常会提供这些切片模式，并默认切在 50% 位置，也就是中间附近。

### 6.6.3 3D：三维整体

三维整体适合看几何外形、整体分布和大尺度结构。但如果变量主要在内部变化，三维整体可能看不清，需要配合切片、透明度或等值面。

### 6.6.4 Contour：等值线或等值面

等值线/等值面表示“某个变量等于某些值的位置”。例如温度等于某个值的区域、组分浓度达到某个阈值的区域。它适合查看：

- 火焰面大致位置；
- 高温区边界；
- 某个组分达到一定浓度的位置；
- 压力或密度的分层结构。

### 6.6.5 Vector：矢量图

矢量图用箭头表示方向和大小，最常见的是速度矢量。COAST 的 图形辅助界面 会在发现 `01_Velocity_U`、`01_Velocity_V`、`01_Velocity_W` 三个速度分量时，组合出一个 `COAST_velocity` 矢量字段。

矢量图适合查看：

- 流动方向；
- 回流区；
- 射流方向；
- 速度大致强弱。

注意：箭头太密会看不清。可以调大 stride 或减少箭头数量。图形辅助界面 自动图通常会使用简化后的箭头设置。

## 6.7 可选辅助：用图形辅助界面生成基础后处理图片

如果服务器上安装了 VisIt，图形辅助界面 可以自动调用 VisIt 生成 PNG 图片。它通常会做这些事：

- 扫描 `Visit/` 中的数据组；
- 找到可用的标量和矢量字段；
- 选择 `Pseudocolor`、`Contour` 或 `Vector`；
- 选择切片方向或三维视角；
- 调用 `visit -nowin -cli` 在后台生成图片；
- 把图片保存到 `Visit/postprocess/`。

生成后的图片通常位于：

```text
EXEC.demo/Visit/postprocess/
```

如果 图形辅助界面 提示：

```text
VisIt executable not found; set COAST_VISIT_BIN or install visit
```

说明服务器上找不到 VisIt。解决办法是安装 VisIt，或者请管理员设置：

```bash
export COAST_VISIT_BIN=/path/to/visit
```

然后重新启动 图形辅助界面。

## 6.8 在 VisIt 里保存图片

如果你是在 VisIt 图形界面中查看结果，保存图片的一般步骤是：

1. 调整好变量、切片、颜色范围和视角；
2. 选择 `File` -> `Set save options`；
3. 选择图片格式，例如 PNG；
4. 设置分辨率，例如 1280 x 900 或 1920 x 1080；
5. 选择保存目录；
6. 点击 `Save window`。

保存图片时建议文件名包含：

- 算例名；
- 输出步数；
- 变量名；
- 图类型；
- 切片方向。

例如：

```text
case01_step05000_temperature_slice_y.png
case01_step05000_velocity_vector_slice_z.png
```

这样以后回看时，不用打开 VisIt 也能知道图片含义。

## 6.9 结果归档建议

一个完整可复查的结果归档，至少应包含：

- 本次使用的 `input.d`；
- 本次使用的 `boundary_conditions.d`；
- 本次使用的 `ibm_mesh.d`；
- 本次使用的 `vtk_output.d`；
- `screen`；
- `coastctl monitor` 报告的外部 `stdout.log`、`stderr.log`；
- `.coast_run_logs/` 中对应的 `coast_run.json` 或 `coast_run_plan.json`；
- 需要复看的 `Visit/solution.visit` 和对应 `.vtk`；
- 如果后续要续算，完整的 `Restart/`；
- 如果使用了 图形辅助界面 后处理，`Visit/postprocess/` 中的图片。

注意：`Visit/` 是给人看结果用的，`Restart/` 是给程序续算用的。二者用途不同，不能互相替代。只有 `Visit/` 不能续算，只有 `Restart/` 也不能直接在 VisIt 里查看完整常规结果。

# 7. 常见问题排查

遇到问题时，先不要慌，也不要反复修改很多文件。排查最重要的是保留现场：日志、输入文件、运行计划、结果目录。COAST 常见问题大多能从 `screen`、`coastctl monitor` 报告的外部 stdout/stderr 日志、`doctor` 和 `monitor` 里找到线索。

## 7.1 通用排查顺序

推荐每次都按下面顺序收集信息。

### 7.1.1 看 doctor

```bash
bin/coastctl doctor --case-dir EXEC.demo --json
```

如果这里已经有失败项，优先处理。比如 `mpirun` 不存在、主求解器不可执行、`Restart` 数量不匹配，都属于启动前就该解决的问题。

### 7.1.2 看 monitor

```bash
bin/coastctl monitor --case-dir EXEC.demo --json
```

重点看：

- `screenExists` 是否为 `true`；
- `lastStep` 有没有增长；
- `stdoutBytes`、`stderrBytes` 是否异常；
- `errorSummary` 是否有内容。

### 7.1.3 看最近日志

```bash
tail -120 EXEC.demo/screen
```

执行位置：便携包根目录。

stdout/stderr 的实际路径以 `bin/coastctl monitor --case-dir EXEC.demo --json` 报告为准，通常在 `.coast_run_logs/` 下。如果某个文件不存在，说明程序可能还没写到它，或者启动阶段就失败了。不存在本身也是线索。

### 7.1.4 看关键输入文件

```bash
sed -n '1,220p' EXEC.demo/input.d
sed -n '1,260p' EXEC.demo/boundary_conditions.d
```

执行位置：便携包根目录。

这一步不是让新手理解所有参数，而是确认最近有没有明显误改：步数是不是离谱、Restart 开关是否和文件匹配、边界坐标范围是否写错、物种名是否拼错。

### 7.1.5 暂停修改，整理问题描述

如果你需要联系开发者或管理员，建议提供：

- 算例目录名；
- 你执行的命令；
- rank 数；
- 最近改过哪些文件；
- `doctor` 输出；
- `monitor` 输出；
- `coastctl monitor` 报告的外部 `stderr.log` 最后 120 行；
- `coastctl monitor` 报告的外部 `stdout.log` 最后 120 行；
- `screen` 最后 120 行；
- 是否能复现，也就是重新运行是否同样失败。

注意：不要只发一句“算不动了”。没有日志，别人很难判断是输入问题、MPI 问题、网格问题、边界问题还是数值发散。

## 7.2 图形辅助界面 连不上

### 现象

浏览器打开：

```text
http://127.0.0.1:18765
```

但显示无法访问、连接被拒绝、页面一直转圈，或打不开。

### 常见原因

- Linux 服务器上没有启动 `bin/coast-ui`；
- 图形辅助界面 启动后已经退出；
- 端口不是 `18765`；
- Windows PowerShell 的 SSH 端口转发没有保持打开；
- SSH 登录的不是同一台服务器；
- 服务器防火墙或安全策略阻止连接；
- 你把 `127.0.0.1` 的含义弄混了；
- 浏览器访问的是 `http`，但复制成了别的地址；
- 端口被其他程序占用。

### 处理步骤

在 Linux 服务器上重新启动 图形辅助界面：

```bash
bin/coast-ui --workspace "$PWD" --case-dir "$PWD/EXEC.demo" --host 127.0.0.1 --port 18765
```

这个终端不要关闭。再在 Windows PowerShell 里执行：

```powershell
ssh -N -L 18765:127.0.0.1:18765 user@server
```

PowerShell 窗口也不要关闭。然后浏览器打开：

```text
http://127.0.0.1:18765
```

如果仍然打不开，换一个端口试试，例如服务器上：

```bash
bin/coast-ui --workspace "$PWD" --case-dir "$PWD/EXEC.demo" --host 127.0.0.1 --port 18766
```

Windows PowerShell：

```powershell
ssh -N -L 18766:127.0.0.1:18766 user@server
```

浏览器：

```text
http://127.0.0.1:18766
```

注意：不要轻易使用 `--host 0.0.0.0`。它会让服务监听更多网络地址，只适合可信私有网络或有防火墙保护的环境。

## 7.3 端口转发失败

### 现象

PowerShell 中执行：

```powershell
ssh -N -L 18765:127.0.0.1:18765 user@server
```

后报错，或者命令看似运行但浏览器打不开。

### 常见原因

- `user@server` 写错；
- SSH 密码、密钥或跳板机设置不正确；
- Windows 本地的 `18765` 端口已经被占用；
- 服务器上的 图形辅助界面 不是运行在 `18765`；
- 服务器的 SSH 配置禁止端口转发；
- 公司或校园网络限制了 SSH；
- PowerShell 窗口被关闭，转发随之断开。

### 处理步骤

先确认普通 SSH 能登录：

```powershell
ssh user@server
```

如果普通 SSH 都不能登录，先解决账号、网络或密钥问题。

如果普通 SSH 可以登录，但端口转发失败，换一个本地端口：

```powershell
ssh -N -L 18766:127.0.0.1:18765 user@server
```

这条命令的意思是：Windows 本地用 `18766`，服务器那边仍然连 `18765`。浏览器应打开：

```text
http://127.0.0.1:18766
```

如果服务器 图形辅助界面 也换成了 `18766`，则两边都写 `18766`：

```powershell
ssh -N -L 18766:127.0.0.1:18766 user@server
```

注意：`-N` 表示只做转发，不打开远程 shell。它正常运行时可能没有任何输出，看起来像“卡住了”，其实是在保持隧道。不要关闭这个窗口。

## 7.4 `mpirun` 没启动或找不到

### 现象

`coastctl run` 报错：

```text
mpirun not found
```

或者 `doctor` 中 `mpirun` 检查失败。

### 原因

COAST 并行运行依赖 MPI。`mpirun` 是启动多个 rank 的命令。如果系统找不到 `mpirun`，COAST 就不能按并行方式启动。

### 处理步骤

在服务器上检查：

```bash
which mpirun
```

如果没有输出，说明当前环境找不到 MPI。你可以：

- 确认是否需要先加载集群模块，例如管理员提供的 `module load ...`；
- 确认是否需要先执行便携包的环境脚本；
- 联系管理员安装或配置 MPI；
- 不要自己随意安装多个 MPI 版本混用。

如果 `which mpirun` 有输出，但运行仍失败，先用 monitor 找到外部 `stderr.log`：

```bash
bin/coastctl monitor --case-dir EXEC.demo --json
```

常见原因包括 MPI 版本和程序编译环境不匹配、服务器资源不足、作业系统不允许直接在登录节点运行等。集群环境下可能需要通过作业调度系统提交，而不是直接 `mpirun`。

## 7.5 Restart 数量和 rank 不匹配

### 现象

续算时失败，或者 `doctor` 提示类似：

```text
pdf=64 restart=128
decomp=64 restart=128
```

也可能在日志里看到无法打开某个 `restart.NNN` 或 `restart_pdf.NNN`。

### 原因

每个 rank 都需要自己的 Restart 文件。比如用 128 个 rank 续算，通常需要：

```text
Restart/restart.000
...
Restart/restart.127
```

如果还要读取 PDF Restart，也需要：

```text
Restart/restart_pdf.000
...
Restart/restart_pdf.127
```

只要少一个、编号不连续、数量不一致，程序就可能失败。

### 处理步骤

先统计文件数量：

```bash
find EXEC.demo/Restart -maxdepth 1 -name 'restart.[0-9][0-9][0-9]' | wc -l
find EXEC.demo/Restart -maxdepth 1 -name 'restart_pdf.[0-9][0-9][0-9]' | wc -l
```

执行位置：便携包根目录。

如果 `restart.NNN` 是 128 个，而 `restart_pdf.NNN` 是 0 个，说明你可能只有流场 Restart，没有 PDF Restart。此时不要读 PDF Restart，把 `input.d` 中 `read_pdf` 设为 false，但可以保留 `write_pdf` 为 true，让下一段计算写出新的 PDF Restart。

如果 `restart.NNN` 是 128 个，而 `restart_pdf.NNN` 是 64 个，不要强行运行。需要找回完整的 PDF Restart，或者确认是否可以不读 PDF Restart 后重新生成。

如果 `restart.NNN` 数量和你计划的 `--ranks` 不一致，不要随意删文件来“凑数量”。需要改变 rank 数或切换新 runtime mesh 时，先使用 `coastctl run --preflight`；生产路径默认通过 C++ `coast_remap` 写 staging，再由受控 activation 决定是否替换 active `Restart/runtime_mesh`。

注意：从 128 rank 改成 64 rank 续算不是简单删掉一半文件就行。那涉及重分块或重映射，属于高级操作，需要开发者确认。

## 7.6 Visit 文件不完整

### 现象

VisIt 打开 `.visit` 后报错，或者只显示一部分区域，或者 图形辅助界面 中某组结果显示 `.visit` 有了但 `.vtk` 数量明显不对。

### 常见原因

- 计算还没写完就复制了 `Visit/`；
- 只下载了 `.visit`，没有下载 `.vtk`；
- 某些 rank 的 `.vtk` 没写出来；
- 文件复制过程中中断；
- 磁盘满了，导致部分结果没写完；
- 你把不同算例的 `.visit` 和 `.vtk` 混在一起；
- 输出时程序异常退出。

### 处理步骤

先看 图形辅助界面 的 Visit 分组，确认 `vtkCount` 是否合理。命令行也可以粗略检查：

```bash
find EXEC.demo/Visit -maxdepth 1 -name '*.visit' | wc -l
find EXEC.demo/Visit -maxdepth 1 -name '*.vtk' | wc -l
```

如果你知道 rank 数和输出步数，可以估算 `.vtk` 数量。例如 128 rank、1 个输出步，通常至少有 128 个对应的 `solution.<step>.domain.<rank>.vtk`。

检查 `.visit` 引用内容：

```bash
sed -n '1,80p' EXEC.demo/Visit/solution.visit
```

如果里面列出的 `.vtk` 文件在目录中不存在，就说明结果不完整。重新从 图形辅助界面 打包下载，或者等计算完全停止并确认文件写完后再复制。

注意：不要把不完整 Visit 当成物理异常。它首先是文件完整性问题。

## 7.7 边界选择为空

### 现象

`boundary preview` 后发现某个入口、出口或壁面没有选到任何边界，或者运行很快报边界配置相关错误。

### 常见原因

- `boundary_conditions.d` 中坐标范围写错；
- `axis`、`side`、`bounds` 等选择器和实际几何方向不一致；
- 几何单位理解错，例如把毫米当成米；
- 入口位置在固体内部，不在流体外边界上；
- 使用了 `source ibmSurface`，但对应 IBM 相邻流体面不存在；
- patch 名称或 STL 标签并不存在；
- 修改网格后没有重新检查边界。

### 处理步骤

先生成边界预览：

```bash
bin/coastctl boundary preview --case-dir EXEC.demo --write --json
```

查看边界文件：

```bash
sed -n '1,260p' EXEC.demo/boundary_conditions.d
```

如果用坐标选择边界，重点核对：

- 坐标轴方向是否正确；
- 最小值和最大值有没有写反；
- 数值单位是否和几何一致；
- 选择范围是否确实覆盖边界面；
- 是否误选到了内部区域。

如果你不确定几何位置，先用网格/IBM 预览功能查看，而不是反复猜坐标。

注意：边界为空时不要直接扩大到整个域。入口、出口、壁面选错会让计算结果失去意义，即使程序能跑也不代表正确。

## 7.8 计算失败或提前停止

计算失败不一定是同一种问题。按大类可以分成配置问题、运行环境问题、网格/边界问题、喷雾模型问题、数值发散问题等。

### 7.8.1 配置问题

常见表现：

- 缺少输入文件；
- 某个 `*.d` 格式写错；
- 输出频率为 0 或不合理；
- Restart 开关和文件不匹配；
- 物种名称拼写错误；
- 路径指向不存在的文件。

先运行：

```bash
bin/coastctl case validate --case-dir EXEC.demo --json
bin/coastctl doctor --case-dir EXEC.demo --json
```

如果它们报错，优先修配置。

### 7.8.2 运行环境问题

常见表现：

- `mpirun not found`；
- MPI 报错；
- 程序没有权限执行；
- 登录节点不允许长时间运行；
- 磁盘满；
- 内存不足；
- 同一个算例目录重复启动。

检查：

```bash
which mpirun
ls -l bin/coast-solver
bin/coastctl monitor --case-dir EXEC.demo --json
```

如果是集群资源问题，通常需要联系管理员或使用作业调度系统。

### 7.8.3 网格或 IBM 问题

常见表现：

- 日志提到 IBM、mesh、STL、mask；
- 边界预览为空；
- 网格状态异常；
- Restart 中保存的网格和当前 `runtime_mesh/` 不一致；
- 几何改了，但仍然使用旧 Restart。

检查：

```bash
bin/coastctl mesh status --case-dir EXEC.demo --json
bin/coastctl boundary preview --case-dir EXEC.demo --write --json
```

如果换过几何或网格，不要直接沿用旧 Restart，除非已经按专门流程做过 Restart 重映射和 preflight。

### 7.8.4 数值发散

常见表现：

- `screen` 或外部 stdout/stderr 日志出现 `NaN`；
- 出现 `Inf` 或 `infinity`；
- 残差、速度、温度、压力突然变得极大；
- 程序提前 abort；
- 结果图出现大片不合理颜色，随后程序失败。

数值发散可能由很多原因造成，例如时间步太大、边界条件不合理、初始场和边界差异过大、网格质量差、物性或组分设置错误、喷雾/燃烧源项过强等。新手不要直接判断“肯定是某个模型坏了”。

先收集：

```bash
bin/coastctl monitor --case-dir EXEC.demo --json
tail -120 EXEC.demo/screen
```

stdout/stderr 的实际文件请从 `monitor` 输出里的 `stdoutLog` 和 `stderrLog` 字段读取。

然后记录失败发生在第几步、哪个字段先异常、最近改过哪些输入。

### 7.8.5 正常提前停止

不是所有“停止”都是失败。下面这些可能是正常停止：

- 达到 `lstep`；
- 达到设定终止时间；
- 用户创建了 `stop_coast`；
- 日志出现 `finished`；
- 日志出现 `time > tlast or istep > lstep: stop`；
- 停止前写出了 Restart 和 Visit。

如果程序按预期跑完短测并停止，这是好事。不要把“程序退出”本身当成错误。

## 7.9 `coastctl run` 提示已有运行正在 active

### 现象

启动时报类似：

```text
existing coast run appears active
```

### 原因

`coastctl` 在 `.coast_run_logs/_state/` 的外置状态文件中记录了上一次
启动的进程号，并检查到这个进程仍然存在。它会阻止你在同一个算例目录里
重复启动，避免两个 COAST 同时写同一批 `Restart/` 和 `Visit/`。

### 处理步骤

先监看：

```bash
bin/coastctl monitor --case-dir EXEC.demo --json
```

如果确实还在运行，不要重复启动。需要停止就执行：

```bash
bin/coastctl stop --case-dir EXEC.demo --json
```

如果你确认之前的进程已经结束，但记录仍旧存在，先检查日志和进程状态，
再联系有经验的人处理。不要随手删除 `.coast_run_logs/_state/` 里的状态文件后
立刻重启，除非你确认没有旧进程还在写文件。

## 7.10 日志里有 `fatal`、`abort`、`NaN` 或 `Inf`

### 现象

`coastctl monitor` 的 `errorSummary` 中有内容，或日志中出现：

```text
fatal
abort
NaN
Inf
infinity
```

### 处理步骤

第一步，停止继续扩大损失。如果程序还在跑，先温和停止：

```bash
bin/coastctl stop --case-dir EXEC.demo --json
```

第二步，保存现场。不要删除 `screen`、外部 stdout/stderr 日志、`Restart/` 或 `Visit/`。

第三步，收集日志：

```bash
bin/coastctl monitor --case-dir EXEC.demo --json
tail -120 EXEC.demo/screen
```

stdout/stderr 的实际文件请从 `monitor` 输出里的 `stdoutLog` 和 `stderrLog` 字段读取。

第四步，回忆最近改动：

- 是否改了边界条件；
- 是否改了入口速度、温度、压力或组分；
- 是否改了网格；
- 是否从旧 Restart 续算；
- 是否改变了 rank 数；
- 是否启用了喷雾、点火或燃烧相关设置；
- 是否把正式步数、输出间隔写错。

注意：出现 `NaN` 或 `Inf` 后生成的结果通常不应作为正式结果使用。即使 VisIt 能打开，也只能用于排查，不应用于报告结论。

## 7.11 `Restart/runtime_mesh` 和当前网格不一致

### 现象

续算时，日志或工具提示 Restart 保存的网格身份与当前 `runtime_mesh/` 不匹配，或者提到 restart-to-new-mesh remap 相关信息。

### 原因

Restart 不是只保存数字场，还和当时的网格分块有关。COAST 现在会保存 Restart 对应的运行时网格信息，以避免你把旧流场硬套到新网格上。

如果你换了几何、重新生成网格、改变分块，旧 Restart 可能不再适合直接读取。

### 处理步骤

先检查：

```bash
bin/coastctl mesh status --case-dir EXEC.demo --json
```

如果你只是想继续上一次计算，不应该替换 `runtime_mesh/`。找回和 Restart 配套的 `runtime_mesh/`，或者使用完整的旧算例目录续算。

如果你确实要从旧网格迁移到新网格，这属于 Restart 重映射或 Mesh-4/Mesh-5 高级流程。新手不要手工移动文件完成这个操作，应使用 `coastctl run --preflight` 查看受控计划，再由 `coastctl run --execute` 完成生产 prepare/remap/activation。普通用户仍可在手工路径使用 `cd EXEC && mpirun -np N ./coast`；如果 MPI size differs and startup regrid / restart remap is allowed，启动阶段会在 solver reads fields 之前走受控 preflight/write/remap 路径，失败时失败关闭并保留诊断。

常见 remap/preflight 失败原因包括：缺少 `coast_remap`，rank 或文件数量不一致，marker transition gate 未通过，staging 输出目录已存在但未允许 overwrite，或者 progress file 放在 output-dir 里面。

## 7.12 图形辅助界面 能打开，但启动运行失败

### 现象

浏览器能打开 图形界面，但点击运行后失败。

### 常见原因

- 图形辅助界面 指向的 `--case-dir` 不是你想运行的算例；
- rank 数填错；
- `case validate` 失败；
- 服务器找不到 `mpirun`；
- 封装目录中找不到可执行的主求解器；
- 已经有运行中的 COAST；
- 图形辅助界面 后台没有权限写算例目录；
- `input.d` 中 Restart 开关和实际文件不匹配。

### 处理步骤

回到服务器终端执行同样的命令，错误会更清楚：

```bash
bin/coastctl doctor --case-dir EXEC.demo --json
bin/coastctl run --case-dir EXEC.demo --ranks 128 --preflight --write --json
```

如果 preflight 都过不了，先不要在 图形界面 里点正式启动。

## 7.13 图形辅助界面 后处理失败

### 现象

图形辅助界面 能看到 Visit 数据，但生成图片失败，提示找不到 VisIt，或者提示某个 dataset、field、plot type 不支持。

### 常见原因

- 服务器上没有安装 VisIt；
- `visit` 命令不在 PATH 中；
- `COAST_VISIT_BIN` 没有设置或指向错误；
- `.visit` 存在但对应 `.vtk` 不完整；
- 选择的字段在该数据集中不存在；
- 选择了矢量图，但没有完整速度分量；
- VisIt 后台运行超时或报错。

### 处理步骤

检查 VisIt：

```bash
which visit
```

如果没有输出，请安装 VisIt 或设置：

```bash
export COAST_VISIT_BIN=/path/to/visit
```

然后重新启动 图形辅助界面。

检查 Visit 文件完整性：

```bash
find EXEC.demo/Visit -maxdepth 1 -name '*.visit' | wc -l
find EXEC.demo/Visit -maxdepth 1 -name '*.vtk' | wc -l
```

如果字段选择失败，先在 图形辅助界面 中换一个明确存在的标量字段做 `Pseudocolor`，例如温度、压力或标记字段。确认基础云图能生成后，再尝试等值线或矢量图。

## 7.14 磁盘空间不足

### 现象

计算跑着跑着失败，Visit 或 Restart 文件不完整，日志可能出现无法写文件、文件系统错误，或者服务器提示 quota exceeded。

### 原因

`Visit/` 和 `Restart/` 都可能很大。rank 多、输出频率高、步数多时，文件数量会快速增加。

### 处理步骤

检查算例目录大小：

```bash
du -sh EXEC.demo
du -sh EXEC.demo/Visit EXEC.demo/Restart
```

如果空间不足，先停止计算，再和负责人确认哪些旧结果可以归档或删除。不要在程序运行时删除正在写的文件。

新手可安全优先考虑：

- 下载并归档不再需要在线查看的旧 Visit zip；
- 复制完整算例后再清理副本；
- 保留最近一次可续算的完整 `Restart/`。

注意：不要为了省空间只保留 `solution.visit`。它不能单独恢复结果。

## 7.15 什么时候应该停止并联系开发者

出现下面情况，建议停止继续尝试，整理日志后联系开发者或管理员：

- 反复出现 `NaN`、`Inf` 或数值发散；
- Restart 数量、rank 数、网格身份关系搞不清；
- 换过网格后想从旧 Restart 续算；
- `boundary preview` 显示关键入口或出口为空；
- `mpirun` 或 MPI 报系统级错误；
- 同一算例目录可能有多个进程同时写文件；
- `Visit/` 和 `Restart/` 都不完整，但又需要恢复结果；
- 强制停止后不确定 Restart 是否还能用；
- 日志出现你无法判断的 `fatal` 或 `abort`；
- 正式计算结果用于报告、论文或工程结论，但中途有异常。

联系时请提供第 7.1 节列出的信息。信息越完整，定位越快。

## 7.16 新手排错口诀

可以把排查顺序记成一句话：

先看环境，再看输入；先短测，再长跑；先温停，再处理；先打包，再发送；先保留日志，再求助。

对应到 COAST 文件就是：

- 环境：`doctor`；
- 输入：`case validate`、`boundary preview`、`mesh status`；
- 运行：`coastctl run --preflight`、`coastctl run --execute`；
- 监看：`monitor`、`screen`、外部 `.coast_run_logs/` stdout/stderr；
- 停止：`coastctl stop`；
- 结果：`Visit/solution.visit` 加完整 `.vtk`；
- 续算：完整 `Restart/restart.NNN`，必要时还有完整 `restart_pdf.NNN`。

只要按这个顺序来，大多数问题都能被缩小到一个清楚范围，而不是在一堆文件里乱找。


# 8. 非封装版完整程序说明

本章说明的是完整开发工作目录，也就是当前这个目录：

```text
/path/to/Coast_software
```

它和“封装版便携包”不一样。封装版主要给普通用户运行和查看结果，里面只有运行需要的程序、模板算例、图形辅助界面、文档和 agent skills。非封装版完整目录还包含源代码、测试脚本、构建文件、当前正在使用的 `EXEC` 算例、打包工具和开发辅助工具。

普通用户只需要知道：在非封装版里，`EXEC` 是当前算例，`SRC.Coast` 是程序源代码。后续开发者和 AI agent 还需要知道：构建、检查、网格切换、Restart 重映射、打包发布都应该通过工作区内的受控命令完成，不要手工拼目录或删除正在使用的数据。

注意：本章里的命令默认都在 Linux 服务器上执行，并且默认从工作区根目录开始：

```bash
cd /path/to/Coast_software
```

## 8.1 完整工作目录是什么

完整工作目录可以理解为 COAST 的“维修间加运行间”。源码、测试、工具、当前算例和打包输出都在同一个目录树里，便于开发和验证。

当前工作区的核心结构如下：

```text
Coast_software/
  SKILL.md
  README.md
  workplan.md
  coastctl
  coast-ui
  docs/
    USER_MANUAL.md
    manual_sections/
  scripts/
    check_layout.sh
  SRC.Coast/
    Makefile
    app/
    parallel/
    cpp/
    mesh/
    physics/
    tools/
    ui/
    tests/
    ai/skills/
  EXEC/
    coast
    coast_remap
    input.d
    ibm_mesh.d
    boundary_conditions.d
    vtk_output.d
    spray.d
    spark.d
    probe.d
    heat_release.d
    mesh5_auto_refine.d
    Geometry/
    Fuels/
    Decomp/
    runtime_mesh/
    Restart/
    Visit/
    Info/
  codegraphf_portable/
  dist/
  templates/
  tests/
  third_party/
```

这些目录的用途如下：

| 路径 | 给普通用户的解释 | 给开发/AI agent 的解释 |
| --- | --- | --- |
| `SKILL.md` | 当前工作区的总说明。 | 进入工作区后先读它，再选择子 skill。 |
| `workplan.md` | 当前开发阶段和禁区说明。 | Mesh-4/Mesh-5 状态、核心检查、禁止事项的当前事实来源。 |
| `coastctl` | 常用操作命令入口。 | 根目录 wrapper，实际调用 `SRC.Coast/tools/coastctl.py`。 |
| `coast-ui` | 启动中文 图形辅助界面 的入口。 | 根目录 wrapper，服务代码在 `SRC.Coast/ui/`。 |
| `docs/` | 用户手册和说明文档。 | 手册整合、章节分工和发布文档来源。 |
| `scripts/` | 工作区辅助检查脚本。 | `check_layout.sh` 用于确认目录完整性。 |
| `SRC.Coast/` | COAST 程序源代码。 | Fortran/C++ 源码、工具、图形界面、测试和 agent skills 所在地。 |
| `EXEC/` | 当前算例和可执行程序所在目录。 | active case，运行输入、运行输出、活动网格、Restart、Visit 都在这里。 |
| `codegraphf_portable/` | 代码检索工具的便携安装包。 | 迁移服务器后可安装 CodeGraphF。 |
| `dist/` | 便携包输出目录。 | `coastctl package build` 的输出位置之一。 |
| `third_party/` | 第三方依赖或离线包。 | 当前包含 OCE/OpenCASCADE 相关本地材料。 |

注意：`EXEC/` 不是模板目录，而是当前活跃算例。里面的 `Restart/`、`runtime_mesh/`、`Decomp/`、`Visit/` 可能包含正在使用或正在分析的数据，不能随手清空。

## 8.2 `SRC.Coast` 与 `EXEC` 的关系

`SRC.Coast` 和 `EXEC` 是非封装版最重要的一对目录。

`SRC.Coast` 是“程序从哪里来”。它包含 COAST 的 Fortran/C++ 源码、构建文件、测试脚本、网格和 Restart 工具、图形辅助界面 后端、打包工具以及 AI agent skills。

`EXEC` 是“程序在哪里跑”。它包含当前可执行程序 `EXEC/coast`、C++ Restart 重映射后端 `EXEC/coast_remap`、当前输入文件、几何、燃料、运行网格、Restart 数据、Visit 输出和 `screen`。`coastctl` 的 stdout/stderr、run manifest、PID/session 状态应放在算例外部 `.coast_run_logs/`，不应污染 `EXEC` 根目录。

常见关系可以这样记：

| 动作 | 主要目录 | 结果 |
| --- | --- | --- |
| 改程序源代码 | `SRC.Coast/` | 下一次构建后影响 `EXEC/coast`。 |
| 构建程序 | `SRC.Coast/` | 生成或更新 `../EXEC/coast` 和 `../EXEC/coast_remap`。 |
| 改算例参数 | `EXEC/*.d` | 不需要重新编译，但运行前要验证。 |
| 运行计算 | `EXEC/` 或 `./coastctl run` | 读取 `EXEC` 输入，写 `EXEC/screen`、`Visit/`、`Restart/` 等；run-control 日志写到外部 `.coast_run_logs/`。 |
| 检查网格状态 | `./coastctl mesh status --case-dir EXEC` | 读取 `EXEC/runtime_mesh`、`EXEC/Decomp` 和相关身份文件。 |
| 打便携包 | 根目录 `./coastctl package build` | 从 `SRC.Coast` 和轻量模板提取运行包，输出到 `dist/`。 |

注意：不要把 `SRC.Coast` 复制进便携运行包。便携包只应该包含运行所需的二进制、模板算例、图形界面、文档和 agent skills。

## 8.3 第一次进入非封装版工作区时先检查什么

进入工作区后，先确认目录和关键文件齐全：

```bash
cd /path/to/Coast_software
./scripts/check_layout.sh
```

这个命令应该输出类似信息：

```text
COAST layout check
cwd=Coast_software
present source SRC.Coast
active_source=SRC.Coast
present case EXEC
active_case=EXEC
present exec_input EXEC/input.d
present exec_input EXEC/boundary_conditions.d
...
```

如果看到 `missing source SRC.Coast` 或 `missing case EXEC`，说明当前目录不是完整工作区，或者目录被移动/删掉了。此时不要继续构建或运行，先确认路径。

也可以用 `coastctl doctor` 做更偏运行层面的检查：

```bash
cd /path/to/Coast_software
./coastctl doctor --case-dir EXEC --json
```

这个命令会用 JSON 输出检查结果。普通用户只要看是否有明显的错误字段；开发/AI agent 应该保存或引用关键错误信息，而不是只说“doctor 失败”。

## 8.4 构建程序

构建的意思是：把 `SRC.Coast` 里的源代码编译成能运行的 `EXEC/coast`。

在工作区根目录执行：

```bash
cd /path/to/Coast_software
cd SRC.Coast
make -j 8
test -x ../EXEC/coast
test -x ../EXEC/coast_remap
```

每一步的含义如下：

| 命令 | 作用 | 预期结果 |
| --- | --- | --- |
| `cd SRC.Coast` | 进入源码目录。 | 当前目录变成 `SRC.Coast`。 |
| `make -j 8` | 用 8 个并行任务编译程序。 | 编译结束时没有 `Error`，并生成/更新可执行程序。 |
| `test -x ../EXEC/coast` | 检查 `EXEC/coast` 是否存在且可执行。 | 命令无输出并返回成功。 |
| `test -x ../EXEC/coast_remap` | 检查 C++ Restart remap 后端是否存在且可执行。 | 命令无输出并返回成功。 |

如果构建失败，先看终端最后几十行错误。常见原因包括编译器环境不完整、上一次构建留下了不兼容的 `.mod` 文件、源文件刚被改坏。不要在没有读错误的情况下删除 `EXEC/Restart` 或 `EXEC/runtime_mesh`，构建失败通常和运行数据无关。

注意：构建不会自动开始计算。真正运行计算需要 `mpirun` 或 `coastctl run --execute`。

## 8.5 核心检查命令

下面这些命令是非封装版日常检查的主线。普通用户可以把它们当作“运行前体检”。开发/AI agent 应该在改代码、改输入、改网格或打包前后执行相关检查。

### 工作区和算例检查

```bash
cd /path/to/Coast_software
./scripts/check_layout.sh
./coastctl doctor --case-dir EXEC --json
./coastctl case validate --case-dir EXEC --json
./coastctl mesh status --case-dir EXEC --json
```

含义如下：

| 命令 | 检查内容 | 正常时应看到什么 |
| --- | --- | --- |
| `./scripts/check_layout.sh` | 目录和关键输入是否存在。 | `present source`、`present case`、`present exec_input`。 |
| `./coastctl doctor --case-dir EXEC --json` | 运行环境和算例基础状态。 | JSON 中没有致命错误。 |
| `./coastctl case validate --case-dir EXEC --json` | `EXEC/*.d` 输入文件是否能被工具识别。 | JSON 表示验证通过。 |
| `./coastctl mesh status --case-dir EXEC --json` | 当前网格来源、rank 数、活动网格状态。 | 能读到 `runtime_mesh` 状态和 rank 信息。 |

### 边界和网格预览检查

```bash
cd /path/to/Coast_software
./coastctl boundary preview --case-dir EXEC --write --json
./coastctl mesh preview --case-dir EXEC --write --json
```

`boundary preview` 会根据 `EXEC/boundary_conditions.d` 预览入口、出口、壁面等边界选择，必要时写出 `boundary_preview.json`。它能帮助发现“选择区域为空”“边界选到了错误侧面”“IBM 表面入口没有匹配到流体邻近面”等问题。

`mesh preview` 会生成或更新网格预览材料。普通用户通常只需要通过 图形辅助界面 看图；开发者可以检查写出的 JSON、Visit 预览和网格报告。

### 图形辅助界面 自检

```bash
cd /path/to/Coast_software
python3 SRC.Coast/ui/coast_ui.py --self-test --workspace .
```

这个命令不会启动长期服务，而是检查 图形界面 后端能否加载工作区、读取必要接口。正常时应返回成功；如果失败，先看错误是否和路径、Python 环境、输入文件缺失有关。

### 运行前预检

```bash
cd /path/to/Coast_software
./coastctl run --case-dir EXEC --ranks 128 --preflight --json
```

`--preflight` 是运行前检查，不等于正式启动。它应该检查 rank 数、Restart 文件数量、PDF Restart 文件数量、runtime mesh 文件数量等是否匹配。

当 `input.d` 请求 restart-time regrid 或 rank 数需要替换时，生产 preflight/execute 默认使用 C++ `EXEC/coast_remap`。Python reference 只有显式传入 `--remap-backend python-reference` 才会使用；找不到 `EXEC/coast_remap` 时应报错停止，不静默回退。

注意：只有加上 `--execute` 才会真正启动 `mpirun`。对生产算例，必须先确认 `EXEC/input.d` 里的步数限制、Restart 设置、rank 数和输出位置。

注意：普通用户命令仍是 `cd EXEC && mpirun -np N ./coast`。如果 MPI size differs from the active runtime mesh rank count，且配置允许 startup regrid / restart remap，启动阶段会在 solver reads fields 之前走受控 preflight/write/remap 路径；如果 rank、文件数量、mesh identity、remap 后端或门禁条件不满足，direct solver 会失败关闭并写出 `screen` / JSON 诊断。

### 正式启动和监看

只有在用户明确授权真实运行时，才使用：

```bash
cd /path/to/Coast_software
./coastctl run --case-dir EXEC --ranks 128 --execute --write --json
```

监看当前运行状态：

```bash
cd /path/to/Coast_software
./coastctl monitor --case-dir EXEC --json
tail -80 EXEC/screen
```

温和停止：

```bash
cd /path/to/Coast_software
./coastctl stop --case-dir EXEC --json
```

注意：不要直接杀进程作为首选停止方式。先用 `coastctl stop`，因为它更符合当前工作区的运行约定。

## 8.6 推荐测试集合

下面是 Mesh-3、Mesh-4、Restart、Mesh-5 和 图形界面 的核心静态/工作流检查。它们大多不会启动长时间真实计算，适合开发后验证。

```bash
cd /path/to/Coast_software
python3 SRC.Coast/tests/check_mesh3_runtime_static.py
python3 SRC.Coast/tests/check_mesh4_activation_transaction.py
python3 SRC.Coast/tests/check_restart_interpolation.py
python3 SRC.Coast/tests/check_restart_remap_staging.py
python3 SRC.Coast/tests/check_restart_remap_production_static.py
python3 SRC.Coast/tests/check_mesh5_nonmatching_static.py
python3 SRC.Coast/tests/check_mesh5_auto_refine.py
python3 SRC.Coast/tests/check_plan2_full.py
```

如果当前 `EXEC/Visit` 中有 Visit 输出，并且要检查可视化块交界处是否连续，可以运行：

```bash
cd /path/to/Coast_software/SRC.Coast
python3 tests/check_visit_overlap_continuity.py \
  /path/to/Coast_software/EXEC/Visit
```

这些检查的重点如下：

| 检查脚本 | 重点 |
| --- | --- |
| `check_mesh3_runtime_static.py` | Mesh-3 runtime-conformal 主线是否保持可用。 |
| `check_mesh4_activation_transaction.py` | Mesh-4 激活、回滚、身份同步流程是否受保护。 |
| `check_restart_interpolation.py` | Restart 插值基础逻辑是否正确。 |
| `check_restart_remap_staging.py` | 新网格 Restart staging 是否能生成预期文件。 |
| `check_restart_remap_production_static.py` | 生产路径里不能跳过 Restart/remap 保护。 |
| `check_mesh5_nonmatching_static.py` | Mesh-5 非匹配接口不能被误开。 |
| `check_mesh5_auto_refine.py` | 自动局部加密候选选择器是否按候选模式工作。 |
| `check_plan2_full.py` | Plan2/图形辅助界面 相关工作流是否保持连通。 |

注意：如果某个测试失败，不要马上改无关文件。先读失败信息，确认它是在检查源代码、输入文件、网格文件还是运行输出。

## 8.7 CodeGraphF 辅助检索

CodeGraphF 是源代码导航工具。它适合回答“某个功能在哪里实现”“谁调用了这个模块”“边界条件从输入文件到求解器怎么流动”等问题。

当前项目推荐使用 wrapper：

```bash
~/.local/bin/cgf-coast
```

常用命令如下：

```bash
cgf-coast status
cgf-coast sync
cgf-coast query "mpi halo exchange"
cgf-coast context --code -n 16 "where boundary_conditions.d inlet velocity is applied"
```

命令含义如下：

| 命令 | 什么时候用 | 预期结果 |
| --- | --- | --- |
| `cgf-coast status` | 使用检索结果前。 | 显示索引状态、文件数、节点数或是否需要同步。 |
| `cgf-coast sync` | 修改源码后，或怀疑索引过期时。 | 刷新 `SRC.Coast` 的索引。 |
| `cgf-coast query "<关键词>"` | 想快速找到相关文件/模块/函数。 | 返回可能相关的位置。 |
| `cgf-coast context --code -n <N> "<问题>"` | 需要带代码片段的上下文。 | 返回紧凑的实现上下文。 |

开发/AI agent 的建议顺序是：

1. 架构、调用链、实现位置问题先用 `cgf-coast`。
2. 精确文本查找、日志查找、文件名查找用 `rg`。
3. 不要为了找一个函数去大范围读取整个源码树。

如果工作区迁移到另一台服务器，且没有 `cgf-coast`，可以安装便携副本：

```bash
cd /path/to/Coast_software/codegraphf_portable
bash install_codegraphf.sh
```

安装后执行：

```bash
cgf-coast status
```

如果迁移后项目路径改变，需要检查 `~/.local/bin/cgf-coast` 里的 `PROJECT=` 是否仍指向新的 `SRC.Coast`。

## 8.8 AI SKILLs 的使用方式

本工作区带有给 AI agent 使用的 skill 文件。它们不是普通用户必须学习的内容，但对后续开发和自动化操作非常重要。

进入工作区后，AI agent 应先读根目录：

```text
SKILL.md
```

它说明了工作区布局、安全运行策略、CodeGraphF 用法、失败排查顺序和常见禁区。

如果 `SRC.Coast/ai/skills/` 存在，应按任务选择子 skill：

| Skill 文件 | 适合任务 |
| --- | --- |
| `SRC.Coast/ai/skills/coast-runtime/SKILL.md` | 构建、dry-run、smoke、运行命令。 |
| `SRC.Coast/ai/skills/coast-case-author/SKILL.md` | 创建算例、编辑直接输入文件。 |
| `SRC.Coast/ai/skills/coast-boundary-authoring/SKILL.md` | 编写或调整 `boundary_conditions.d`。 |
| `SRC.Coast/ai/skills/coast-failure-triage/SKILL.md` | 运行失败、数值异常、日志排查。 |
| `SRC.Coast/ai/skills/coast-package-release/SKILL.md` | 构建、审计、安装测试便携发布包。 |
| `SRC.Coast/ai/skills/rangeai-coast-portable/SKILL.md` | 便携包安装、启动 图形界面、短运行、监看。 |
| `SRC.Coast/ai/skills/rangeai-coast-case-boundary/SKILL.md` | 便携包里的 `*.d` 和边界条件编辑。 |

AI agent 的基本规则：

- 先确认当前目录就是 `Coast_software`。
- 先读 `SKILL.md` 和任务对应子 skill。
- 先读日志和输入文件，再改源码。
- 不要在未经授权时启动长时间真实计算。
- 不要删除生产 `Restart/`、`runtime_mesh/`、`Decomp/`、几何、燃料或用户要保留的 Visit 输出。
- 遇到 Mesh-4/Mesh-5 网格相关工作时，先读 `workplan.md` 的当前状态和禁区。

## 8.9 开发者如何更新文档

本手册的章节草稿位于：

```text
docs/manual_sections/
```

主手册位于：

```text
docs/USER_MANUAL.md
```

推荐做法是：

1. 先在 `docs/manual_sections/` 中按分工更新章节正文。
2. 主 agent 统一整合到 `docs/USER_MANUAL.md`。
3. 整合后检查标题层级、命令路径、中文说明和术语是否一致。
4. 打包前确认 `docs/USER_MANUAL.md` 已包含需要发布给用户的最新版内容。

普通用户不需要维护这些文件。开发/AI agent 更新文档时，应注意：

- 全文中文，命令块标明 `bash` 或 `powershell`。
- 第一次出现 COAST/Mesh/Restart/Visit 等术语时给中文解释。
- 每个危险操作都写清执行位置、前提和预期结果。
- 不要写“详见源码”作为解释结尾。
- 不要把临时调试结论写成长期事实。

## 8.10 开发者如何更新封装包

封装包必须通过 `coastctl package build` 创建，不要手工复制目录。

标准流程如下：

```bash
cd /path/to/Coast_software
./coastctl package build --dist-dir dist/coast_portable_latest \
  --version coast-portable-current --archive --force --json
./coastctl package audit \
  --package-dir dist/coast_portable_latest/coast-runtime-coast-portable-current-linux-x86_64 \
  --json
./coastctl package install-test \
  --package-dir dist/coast_portable_latest/coast-runtime-coast-portable-current-linux-x86_64 \
  --json
```

封装包应该包含：

```text
coast-runtime-<version>-linux-x86_64/
  bin/coast-solver
  bin/coast_remap
  bin/coastctl
  bin/coast-ui
  env/coast-env.sh
  ui/static/
  docs/USER_MANUAL.md
  agent_skills/rangeai-coast-portable/SKILL.md
  agent_skills/rangeai-coast-case-boundary/SKILL.md
  SKILL.md
  EXEC_TEMPLATE/
    *.d
    runtime_mesh/
    Restart/
  manifest.json
  PACKAGE_AUDIT.json
  install.sh
```

封装包不应该包含：

| 不应包含 | 原因 |
| --- | --- |
| `SRC.Coast/` | 源码不属于普通运行包。 |
| `.git/` | 版本历史和内部信息不属于发布运行包。 |
| `tests/` | 测试树会增大包体，也不是普通用户运行所需。 |
| CodeGraphF 索引 | 机器路径相关，迁移后容易误导。 |
| `EXEC/Restart` 活跃数据 | 可能很大，且是当前工作区运行状态，不是模板。 |
| `EXEC/Visit` 活跃输出 | 结果文件可能很大，且不应混入干净模板。 |
| `EXEC/*.log`、`EXEC/*.json`、`EXEC/*.pid`、session 临时文件 | run-control 临时文件应在 `.coast_run_logs/`、staging 或归档目录，不应污染模板。 |
| `.F90`、`.cpp`、`.mod`、`.o` 等源码/构建产物 | 运行包只放必要运行文件。 |

打包验收至少满足：

- `package audit` 通过。
- `package install-test` 通过，并包含 `coast-ui --self-test`。
- 包内有 `docs/USER_MANUAL.md`、根 `SKILL.md` 和两个 RangeAI agent skills。
- 包内有 C++ remap 后端。封装版可提供 `bin/coast_remap`，并确保 `coastctl run` 能在工作算例或 `EXEC` 兼容位置找到它；源码版必须有 `EXEC/coast_remap`。
- 包内模板或说明覆盖必要 `*.d` 配置、`runtime_mesh/` 示例，以及空的或示例 `Restart/`。
- 包内不得把 Python reference remap 当作生产自动 fallback；生产默认应为 C++ `coast_remap`，Python reference 只能显式 `--remap-backend python-reference`。
- 源码版/封装版都必须具备 coast、coast_remap、coastctl、必要 `.d` 和目录结构：源码版对应 `EXEC/coast`、`EXEC/coast_remap`、`SRC.Coast/tools/coastctl.py` 和 `EXEC/*.d`，封装版对应 `bin/coast-solver`、`bin/coast_remap`、`bin/coastctl` 和 `EXEC_TEMPLATE/*.d`。
- 包内 `manifest.json` 不把 Mesh-4 候选预览误写成 active solver mesh。
- `coastctl run --execute` 的启动行为仍是受控的后台 `mpirun` 启动，且关闭 stdin。

# 9. 网格、重启动和局部加密方法说明

本章解释 COAST 当前的网格和 Restart 方法。普通用户不需要理解每个底层算法，但需要知道哪些目录代表当前活跃状态，哪些只是候选或预览。开发者和 AI agent 需要严格区分 Mesh-3、Mesh-4、Mesh-5 的职责，避免把候选文件误当成正式求解网格。

## 9.1 先理解几个基础词

网格是把连续的计算区域切成许多小格子。COAST 在这些格子上计算速度、压力、温度、组分、PDF 标量等物理量。

Restart 是重启动数据。它保存某一步的计算状态，后面可以从这一刻继续算，而不是从零开始。

runtime mesh 是运行时网格。当前求解器真正读取的活动网格在：

```text
EXEC/runtime_mesh/
```

Decomp 是旧初始化代码仍需要的兼容桥。当前生成/运行时网格模式下，`EXEC/Decomp` 不应该被当作手工权威输入随意编辑。

IBM 是 immersed boundary method，中文可理解为“浸入边界方法”。它用标记区分流体区域和固体/壁面区域，让复杂几何能嵌在结构化背景网格里。

active solver mesh 是当前求解器真正用于计算的网格。候选网格、预览网格、诊断网格都不是 active solver mesh。

## 9.2 Mesh-3：稳定主线

Mesh-3 是当前稳定的求解主线，可以理解为“运行时一致网格”主线。英文常写作 `runtime_conformal` 或 runtime-conformal。

“conformal” 的意思是相邻块的网格面能对齐。对求解器来说，这很重要，因为相邻 MPI 块交换边界数据时，可以用现有匹配块交换路径，不需要处理粗细不同的非匹配面。

Mesh-3 的关键特点：

- 活动网格来自 `EXEC/runtime_mesh/`。
- `EXEC/Decomp/` 仍作为兼容桥存在，但不是新网格工作的手工权威输入。
- 相邻块之间是匹配接口，现有 `mpi_halo_exchange(field,hhalo)` 快速路径仍可使用。
- 入口、出口、壁面边界由 `EXEC/boundary_conditions.d` 控制。
- STL 几何和坐标/IBM selector 可以共同工作，不要求当前 STL 已有 patch 标签。

当前 `EXEC/ibm_mesh.d` 里的 mesh authority 需要按模式理解：

| `mesh_source` | 含义 | 操作注意 |
| --- | --- | --- |
| `legacy_decomp` | 手工准备的 `EXEC/Decomp` 是权威。 | 只有 `allow_run_from_decomp = .true.` 时才合理。 |
| `generated_decomp` | 集成网格生成器写出 `Decomp`，并用它作为当前来源。 | 仍要通过工具检查生成结果。 |
| `runtime_conformal` | `runtime_mesh` 是权威，`Decomp` 是兼容桥。 | 当前主线思路，不要手改 `Decomp` 当修复。 |
| `runtime_amr` | 预留给真正非匹配 AMR。 | 当前不能生产启用，代码应 fail closed。 |

注意：Mesh-3 的稳定性来自“匹配块”和“受控活动网格”。不要为了局部加密手工把某个候选目录复制到 `EXEC/runtime_mesh`。

## 9.3 Mesh-4：新网格 Restart 闭环

Mesh-4 的目标不是在计算过程中随时动态加密，而是让 COAST 能安全地走完这条闭环：

```text
生成新目标网格
  -> 预览和检查
  -> 把旧 Restart 重映射到新网格
  -> 激活新 runtime_mesh
  -> 同步 Restart 身份
  -> 短步验证
  -> 必要时回滚
```

当前工作区的 Mesh-4/Plan2 已经是闭环基础设施。当前活动状态记录为：

```text
Active solver mesh: EXEC/runtime_mesh
Active mesh source: mesh4_axis_spacing_policy
Active grid: 109 x 319 x 106 over 128 ranks
Active Restart: EXEC/Restart remapped onto the promoted Mesh-4 target
Restart identity: Restart/mesh_identity.NNN must match runtime_mesh/mesh_identity.txt
```

Mesh-4 做了几件关键事：

| 阶段 | 白话解释 | 关键保护 |
| --- | --- | --- |
| 目标网格生成 | 准备一个新的匹配运行网格。 | 先作为 proposal/candidate，不直接覆盖活动网格。 |
| 边界/IBM 重新标记 | 在新网格上重新判断哪些格子是流体、固体、入口、出口、壁面。 | 防止边界或 IBM 标记丢失。 |
| Restart 重映射 | 把旧网格上的物理量搬到新网格。 | 使用流固 mask、PDF 保护、速度/焓保护。 |
| activation preflight | 激活前检查 rank 数、文件数、身份文件。 | 不匹配就拒绝启动。 |
| promotion | 把目标网格切换成 `EXEC/runtime_mesh`。 | 需要同步 Restart mesh identity。 |
| rollback | 出问题时退回之前活动状态。 | 保留可恢复路径。 |

如果手工做过 Mesh-4 promotion 或 rollback，必须同步 Restart 身份：

```bash
cd /path/to/Coast_software
python3 SRC.Coast/tools/mesh4_activation_transaction.py \
  sync-restart-identity --exec-dir EXEC
```

同步身份的意思是：让 `EXEC/Restart` 里的每个 `mesh_identity.NNN` 和活动 `EXEC/runtime_mesh/mesh_identity.txt` 对上。这样重启动时，求解器不会拿旧网格的 Restart 去配新网格。

注意：Mesh-4 候选预览文件仍然有诊断价值，但激活后真正的求解网格只看 `EXEC/runtime_mesh`。

## 9.4 Restart 插值和重映射的白话解释

Restart 重映射可以理解为“把旧地图上的天气值，搬到新地图上的格子里”。

旧网格和新网格的格子位置、大小、数量可能不同。不能简单按文件名复制 `restart.000` 到新目录，因为第 100 个格子在旧网格和新网格上可能不是同一个空间位置。

正确的重映射需要做这些事：

1. 读旧 Restart 和旧 runtime mesh。
2. 读目标 runtime mesh。
3. 对每个目标流体格子，寻找合理的旧网格 donor。
4. 对速度、压力、温度、密度、组分、PDF 标量等场做插值或保护性转移。
5. 检查新旧流固标记，不让流体格子从固体 donor 借值。
6. 写出新网格对应的 `restart.*`、`restart_pdf.*` 和身份/manifest 文件。

生产默认工具是 C++ `EXEC/coast_remap`。`coastctl run --preflight` 和 `coastctl run --execute` 默认使用它；Python reference 只在显式 `--remap-backend python-reference` 时使用。

`coast_remap` 也可以独立 staging-only 使用：

```bash
cd /path/to/Coast_software
EXEC/coast_remap \
  --restart-dir EXEC/Restart \
  --source-runtime-mesh EXEC/Restart/runtime_mesh \
  --target-runtime-mesh EXEC/Mesh5.target/runtime_mesh \
  --output-dir EXEC/Restart.remapped_mesh5_target \
  --overwrite-output \
  --allow-solid-to-fluid-nearest-donor \
  --progress-file /tmp/coast_remap_progress.log
```

它只写 `--output-dir`，不会覆盖 active `EXEC/Restart` 或 `EXEC/runtime_mesh`。`--rank-range A:B` 或 `--rank-list 0,4,7` 可用于诊断性 partial staging，但 partial rank subset 不是 promotable，不能用于替换 active Restart。

常见输出包括：

```text
EXEC/Restart/restart.*
EXEC/Restart/restart_pdf.*
EXEC/Restart/restart.stat
EXEC/Restart/restart_payload_manifest.json
EXEC/Restart/restart_remap_manifest.json
EXEC/Restart/mesh_identity.NNN
EXEC/Restart/runtime_mesh/
```

Restart 重映射检查重点：

| 检查项 | 为什么重要 |
| --- | --- |
| `restart.*` 数量等于 rank 数 | 每个 MPI rank 都需要自己的 Restart 输入。 |
| `restart_pdf.*` 数量等于 rank 数 | 开启 PDF Restart 时，每个 rank 都要有 PDF 状态。 |
| `Restart/runtime_mesh/` 与活动网格一致 | Restart 运行会按该快照理解几何和 IBM 标记。 |
| `mesh_identity.NNN` 匹配 `runtime_mesh/mesh_identity.txt` | 防止旧网格 Restart 混到新网格。 |
| manifest 文件存在 | 便于事后追踪旧网格、新网格和转移方式。 |

可以用下面命令快速数文件：

```bash
cd /path/to/Coast_software
find EXEC/runtime_mesh -maxdepth 1 -name 'block_*.dat' | wc -l
find EXEC/Restart -maxdepth 1 -name 'restart.*' | wc -l
find EXEC/Restart -maxdepth 1 -name 'restart_pdf.*' | wc -l
```

如果计划用 128 ranks 运行，上面三个数量应与当前运行设置相容。若 `read_pdf=true`，`restart_pdf.*` 也必须匹配。

常见 remap 失败原因包括：缺少 `EXEC/coast_remap`，source/target rank 或 Restart 文件数量不一致，marker transition gate 未通过，`--output-dir` 已存在且没有 `--overwrite-output`，或者 `--progress-file` 被放在 `--output-dir` 内。

## 9.5 流固标记保护

流固标记是 COAST 在 IBM 网格里区分“这里是流体”还是“这里是固体/壁面”的基础。当前 Visit 预览中的主要约定是：

```text
IBM_marker = 1.0 表示流体
IBM_marker = 0.0 表示固体
```

流固标记保护的核心原则：

- 流体格子不能从固体 donor 借物理值。
- 固体格子不能被普通流体交换误填。
- 流体到固体、固体到流体的过渡要被计数和报告。
- IBM 壁面邻近的入口选择只能作用在已有流体邻近面上。
- `boundary_conditions.d` 只能选择已有流体边界，不能把固体格子强行变成流体。

对普通用户来说，这意味着：

- 如果入口预览为空，不要通过扩大参数盲目“刷出入口”。
- 如果几何附近只有一层薄流体帽，入口也可能被保护逻辑拒绝。
- `source ibmSurface` 是选择 IBM 壁面邻近流体面，不是打开固体墙。
- `source externalBoundary` 是选择真实外边界，不是任意 MPI 分块面。

对开发/AI agent 来说，以下检查非常重要：

```bash
cd /path/to/Coast_software
python3 SRC.Coast/tests/check_boundary_source_semantics_static.py
python3 SRC.Coast/tests/check_ibm_surface_inlet_velocity_model_static.py
python3 SRC.Coast/tests/check_inlet_opening_depth_static.py
python3 SRC.Coast/tests/check_restart_marker_transition.py
```

这些测试守住几个关键行为：外边界和块内平面不能混淆，IBM 表面入口方向不能乱，入口必须有足够连通深度，Restart 重映射不能忽略流固转换。

## 9.6 Mesh-5：自动局部加密候选

Mesh-5 的目标是让 COAST 将来能支持真正的局部加密，尤其是“一个父块局部细化后，与周围较粗网格相邻”的情况。

这件事比 Mesh-4 难，因为相邻块不再总是面面对齐。细网格的一面可能对应粗网格的一面，格子数量不同，这叫非匹配块交换。求解器需要知道如何在粗细接口上填 ghost cells，如何保护速度、压力、温度、组分、PDF 标量，还要最终验证守恒通量。

当前 Mesh-5 已有安全脚手架和候选生成工具：

```text
SRC.Coast/tools/mesh5_single_block_refine.py
SRC.Coast/tools/mesh5_auto_refine.py
EXEC/mesh5_auto_refine.d
EXEC/Mesh5.auto_refined_candidate/
```

自动局部加密选择器会给候选父块打分。当前评分来源包括：

| 指标 | 白话解释 |
| --- | --- |
| 几何指标 | 几何复杂、靠近壁面或边界变化的区域可能更需要细网格。 |
| 涡量指标 | 流动旋转或剪切强的位置可能更需要细网格。 |
| 反应 `dcdt` 指标 | 燃烧反应变化快的位置可能更需要细网格。 |

默认配置文件是：

```text
EXEC/mesh5_auto_refine.d
```

它默认是关闭的。可以先查看或运行候选检查：

```bash
cd /path/to/Coast_software
./coastctl mesh auto-refine --case-dir EXEC --json
```

如需一次性生成候选，可以使用：

```bash
cd /path/to/Coast_software
./coastctl mesh auto-refine --case-dir EXEC \
  --enable-once --restart-auto-refine --json
```

也可以让运行计划在 Restart 前生成候选，但不要加 `--execute`，先看计划：

```bash
cd /path/to/Coast_software
./coastctl run --case-dir EXEC --ranks 128 \
  --auto-refine-restart-candidate --auto-refine-force \
  --preflight --write --json
```

注意：自动局部加密当前生成的是 candidate，也就是候选包。候选包不是活动求解网格。

## 9.7 为什么 Mesh-5 候选不能直接当 active solver mesh

这是本章最重要的安全规则之一：

```text
Mesh-5 candidate != active solver mesh
```

不能直接把 `EXEC/Mesh5.auto_refined_candidate` 复制到 `EXEC/runtime_mesh`，原因包括：

| 原因 | 解释 |
| --- | --- |
| 非匹配交换还在验证阶段 | 粗细接口需要特殊 halo schedule，不是所有生产场景都已验证。 |
| 候选可能改变块数和 rank 映射 | 一个父块可能拆成 8 个 child blocks，Restart 文件数量也要跟着变。 |
| 候选写有激活门禁 | 当前候选会标记类似 `safe_for_restart_remap_target false` 的状态，表示不能直接提升为生产网格。 |
| Restart 还没完成新目标重映射 | 没有对应新网格 Restart，求解器无法安全继续。 |
| 流固标记和边界需要重新验证 | 局部细化后，IBM 标记、入口深度、边界选择都可能变化。 |
| 保守通量仍需验证 | 粗细接口的质量、动量、焓、组分通量最终要有守恒检查。 |
| 缺少 rollback 保护会很危险 | 出问题时无法可靠回到上一个活动 Mesh-4 状态。 |

候选包可以做这些事：

- 给开发者看哪里适合局部加密。
- 生成 `interfaces.dat`、`interface_<rank>.dat` 等非匹配接口材料。
- 记录 parent/child lineage、粗细比例、marker transition 诊断。
- 用测试脚本验证 C++ runtime schedule、pack/unpack、粗到细插值、细到粗平均。

候选包不能做这些事：

- 不能直接替换 `EXEC/runtime_mesh`。
- 不能直接配旧 `EXEC/Restart` 启动生产求解。
- 不能绕过 Mesh-4 remap、activation preflight 和 rollback。
- 不能作为“已完成动态 AMR”的证据。

## 9.8 Mesh-5 后续目标

Mesh-5 的长期目标是建立静态、预计算的非匹配块交换层。它不是先做动态 AMR，而是先让一个局部细化目标能安全跑起来。

目标能力包括：

- 一个父块可以在一个或多个方向细化。
- 粗块和细块相邻时，运行网格记录粗细接口。
- ghost cell 交换支持标量、PDF 标量、密度、温度、压力和速度。
- 接口诊断能报告最大跳变、平均跳变、守恒漂移。
- 一个细化父块可以拆成多个 child blocks，例如 `2 x 2 x 2` 的 8 个子块。
- 负载平衡按活跃流体单元工作量估算，而不是只按背景格子数。
- Mesh-4 的 Restart remap 和 activation transaction 仍然负责新网格 promotion。

当前相关测试包括：

```bash
cd /path/to/Coast_software
python3 SRC.Coast/tests/check_mesh5_runtime_schedule_active.py
python3 SRC.Coast/tests/check_mesh5_candidate_active_segments.py
python3 SRC.Coast/tests/check_mesh5_mpi_active_exchange.py
python3 SRC.Coast/tests/check_mesh5_single_block_refine.py
python3 SRC.Coast/tests/check_mesh5_synthetic_exchange.py
```

只有当匹配块当前 case 不受影响、粗细接口交换通过、Restart 能进入短步 time stepping、Visit 能看清接口诊断、rollback 仍可用时，Mesh-5 才能逐步接近生产可用。

# 10. 附录

本章汇总常用命令、常用文件、术语、最小演示流程和安全清理规则。

## 10.1 常用命令表

| 目的 | 执行位置 | 命令 |
| --- | --- | --- |
| 进入工作区 | 任意位置 | `cd /path/to/Coast_software` |
| 检查目录布局 | 工作区根目录 | `./scripts/check_layout.sh` |
| 检查环境和算例 | 工作区根目录 | `./coastctl doctor --case-dir EXEC --json` |
| 验证输入文件 | 工作区根目录 | `./coastctl case validate --case-dir EXEC --json` |
| 查看网格状态 | 工作区根目录 | `./coastctl mesh status --case-dir EXEC --json` |
| 预览边界 | 工作区根目录 | `./coastctl boundary preview --case-dir EXEC --write --json` |
| 预览网格 | 工作区根目录 | `./coastctl mesh preview --case-dir EXEC --write --json` |
| 图形界面 自检 | 工作区根目录 | `python3 SRC.Coast/ui/coast_ui.py --self-test --workspace .` |
| 构建程序 | `SRC.Coast` | `make -j 8` |
| 确认可执行文件 | `SRC.Coast` | `test -x ../EXEC/coast` |
| 运行前预检 | 工作区根目录 | `./coastctl run --case-dir EXEC --ranks 128 --preflight --json` |
| 正式启动 | 工作区根目录 | `./coastctl run --case-dir EXEC --ranks 128 --execute --write --json` |
| 监看运行 | 工作区根目录 | `./coastctl monitor --case-dir EXEC --json` |
| 看 screen 末尾 | 工作区根目录 | `tail -80 EXEC/screen` |
| 温和停止 | 工作区根目录 | `./coastctl stop --case-dir EXEC --json` |
| 自动加密候选 | 工作区根目录 | `./coastctl mesh auto-refine --case-dir EXEC --json` |
| 同步 Restart 身份 | 工作区根目录 | `python3 SRC.Coast/tools/mesh4_activation_transaction.py sync-restart-identity --exec-dir EXEC` |
| 构建便携包 | 工作区根目录 | `./coastctl package build --dist-dir dist/coast_portable_latest --version <version> --archive --force --json` |
| 审计便携包 | 工作区根目录 | `./coastctl package audit --package-dir <package-dir> --json` |
| 安装测试便携包 | 工作区根目录 | `./coastctl package install-test --package-dir <package-dir> --json` |
| CodeGraphF 状态 | 工作区根目录 | `cgf-coast status` |
| CodeGraphF 同步 | 工作区根目录 | `cgf-coast sync` |

## 10.2 常用文件和目录表

| 文件或目录 | 用途 | 能否随便删 |
| --- | --- | --- |
| `EXEC/input.d` | 主运行控制，Restart、步数、输出、物理模型等。 | 不能删。 |
| `EXEC/ibm_mesh.d` | 几何、IBM、网格生成、mesh authority 等设置。 | 不能删。 |
| `EXEC/boundary_conditions.d` | 入口、出口、壁面边界条件。 | 不能删。 |
| `EXEC/vtk_output.d` | Visit/VTK 输出变量选择。 | 不能删。 |
| `EXEC/spray.d` | 喷雾和蒸发设置。 | 不能删。 |
| `EXEC/spark.d` | 点火源设置。 | 不能删。 |
| `EXEC/probe.d` | 压力探针设置。 | 不能删。 |
| `EXEC/heat_release.d` | 放热诊断设置。 | 不能删。 |
| `EXEC/mesh5_auto_refine.d` | Mesh-5 自动局部加密候选配置。 | 不建议删。 |
| `EXEC/coast` | 当前可执行程序。 | 可通过重新构建恢复，但不要在运行中删。 |
| `EXEC/coast_remap` | C++ Restart remap 生产后端。 | 源码版生产路径必须保留。 |
| `EXEC/runtime_mesh/` | 当前活动运行网格。 | 不能随便删。 |
| `EXEC/Restart/` | 当前 Restart 输入/输出。 | 不能随便删。 |
| `EXEC/Decomp/` | 兼容桥和旧初始化材料。 | 不能随便删。 |
| `EXEC/Visit/` | 可视化输出。 | 用户确认不需要后才能清。 |
| `EXEC/Info/` | 诊断信息。 | 排查完成且确认不需要后可清部分临时内容。 |
| `EXEC/Geometry/` | STL/几何输入。 | 不能删。 |
| `EXEC/Fuels/` | 燃料/化学相关输入。 | 不能删。 |
| `EXEC/screen` | 运行屏幕日志。 | 运行中不能删；归档后可按需清理旧日志。 |
| `.coast_run_logs/` | `coastctl run` 的 stdout/stderr、run manifest、PID/session 状态。 | 排查完成并确认不需要后可归档或清理。 |
| `EXEC/*.log`、`EXEC/*.json`、`EXEC/*.pid` | 不应出现在 `EXEC` 根目录的 run-control 临时文件。 | 先确认来源和是否仍被运行使用，再移到归档目录；不要把它们当正常输出位置。 |
| `EXEC/Mesh5.auto_refined_candidate/` | Mesh-5 自动加密候选包。 | 确认只是旧候选且不再分析时可删。 |
| `SRC.Coast/` | 源代码。 | 不能删。 |
| `docs/USER_MANUAL.md` | 发布给用户的主手册。 | 不能删。 |
| `docs/manual_sections/` | 分章节草稿。 | 不能删。 |
| `dist/` | 打包输出。 | 旧包确认不需要后可清。 |

## 10.3 常见术语表

| 术语 | 中文解释 |
| --- | --- |
| COAST | 本项目的计算流体/燃烧求解程序。 |
| case | 一个算例，包含输入、网格、几何、Restart 和输出。 |
| `EXEC` | 当前活跃算例目录。 |
| `SRC.Coast` | 当前活跃源代码目录。 |
| solver | 求解器，指真正推进流动/燃烧计算的程序。 |
| `coastctl` | COAST 的命令行操作入口。 |
| 图形辅助界面 | 中文浏览器界面，用于看状态、改部分设置、预览和监看。 |
| Mesh | 网格，把空间切成小格子的计算骨架。 |
| Mesh-3 | 当前稳定的 runtime-conformal 匹配块求解主线。 |
| Mesh-4 | 新目标网格、Restart 重映射、激活和回滚闭环。 |
| Mesh-5 | 面向局部加密和非匹配块交换的下一阶段。 |
| runtime mesh | 当前求解器运行时真正读取的网格。 |
| active solver mesh | 当前正式参与求解的活动网格。 |
| candidate mesh | 候选网格，只能用于检查或后续受控激活，不能直接求解。 |
| Restart | 保存某一步计算状态的数据，用于续算。 |
| Restart remap | 把旧网格 Restart 转移到新网格。 |
| PDF Restart | 概率密度函数相关的 Restart 数据。 |
| rank | MPI 并行进程编号和数量单位。 |
| MPI | 多进程并行运行机制。 |
| IBM | 浸入边界方法，用标记表示流体和固体/壁面。 |
| fluid marker | 流体标记，当前 Visit 预览中通常是 `1.0`。 |
| solid marker | 固体标记，当前 Visit 预览中通常是 `0.0`。 |
| halo exchange | 相邻并行块交换边界层数据。 |
| non-matching exchange | 粗细不同网格块之间的特殊交换。 |
| Visit | 可视化结果组织方式，`solution.visit` 引用多个 VTK 文件。 |
| `*.d` 文件 | COAST 直接输入文件，通常是纯文本配置。 |
| preflight | 运行前预检，不正式启动求解。 |
| promotion | 把候选/目标网格提升为活动网格。 |
| rollback | 出错后退回上一套活动网格和 Restart。 |

## 10.4 最小演示流程

这个流程适合新开发者或新 AI agent 用来确认“工作区能读、能构建、能检查、不会误启动长算例”。

第一步，进入工作区并检查布局：

```bash
cd /path/to/Coast_software
./scripts/check_layout.sh
```

预期看到 `present source SRC.Coast` 和 `present case EXEC`。

第二步，检查算例输入和网格状态：

```bash
./coastctl doctor --case-dir EXEC --json
./coastctl case validate --case-dir EXEC --json
./coastctl mesh status --case-dir EXEC --json
```

预期 JSON 中没有 fatal error，并能读到当前 mesh/rank 信息。

第三步，构建程序：

```bash
cd /path/to/Coast_software/SRC.Coast
make -j 8
test -x ../EXEC/coast
```

预期 `make` 成功，`test` 无输出并返回成功。

第四步，回到根目录做 图形界面 自检和核心测试：

```bash
cd /path/to/Coast_software
python3 SRC.Coast/ui/coast_ui.py --self-test --workspace .
python3 SRC.Coast/tests/check_mesh3_runtime_static.py
python3 SRC.Coast/tests/check_mesh4_activation_transaction.py
python3 SRC.Coast/tests/check_restart_remap_production_static.py
python3 SRC.Coast/tests/check_mesh5_auto_refine.py
```

预期这些命令返回成功。如果失败，读错误信息，不要先删运行数据。

第五步，只做运行前预检：

```bash
cd /path/to/Coast_software
./coastctl run --case-dir EXEC --ranks 128 --preflight --json
```

预期看到 rank、Restart、runtime mesh 等检查结果。这个命令不应启动真实计算。

第六步，如果用户明确要求做短运行，再确认 `EXEC/input.d` 中步数已经限制到短测范围，然后启动：

```bash
cd /path/to/Coast_software
./coastctl run --case-dir EXEC --ranks 128 --execute --write --json
./coastctl monitor --case-dir EXEC --json
tail -80 EXEC/screen
```

注意：不要把“最小演示”变成长时间生产计算。短测前必须确认最大步数、Restart 模式、rank 数和输出保留策略。

## 10.5 安全清理规则

清理前先确认没有计算正在运行：

```bash
pgrep -af 'mpirun|mpiexec|./coast|EXEC/coast' || true
```

如果看到仍有 `mpirun` 或 `coast` 进程，先不要清理。需要停止时优先使用：

```bash
cd /path/to/Coast_software
./coastctl stop --case-dir EXEC --json
```

清理规则分三类。

### 可以在确认后清理的内容

这些通常是外部临时日志、旧候选或旧发布包，但仍建议先列出来看一眼：

```bash
cd /path/to/Coast_software
ls -ld .coast_run_logs 2>/dev/null || true
find EXEC -maxdepth 1 \( -name '*.log' -o -name '*.json' -o -name '*.pid' \) -print
ls -ld EXEC/Mesh5.auto_refined_candidate 2>/dev/null || true
ls -ld dist/* 2>/dev/null || true
```

确认不需要后，可以把外部 `.coast_run_logs/` 或误落在 `EXEC` 根目录的 `.log/.json/.pid` 归档到用户指定位置。不要在文档流程里默认删除真实文件；旧 package 目录、旧候选目录、旧 isolated run 目录，也只有在确认不再用于复现、审计或对比后才能删除。

### 不要随便清理的内容

下面这些目录和文件不要在没有明确授权时删除：

```text
EXEC/Restart/
EXEC/runtime_mesh/
EXEC/Decomp/
EXEC/Geometry/
EXEC/Fuels/
EXEC/*.d
EXEC/coast
EXEC/coast_remap
SRC.Coast/
docs/
```

特别注意：

- `EXEC/Restart/` 可能是续算唯一入口。
- `EXEC/runtime_mesh/` 是当前 active solver mesh。
- `EXEC/Decomp/` 仍是兼容桥，不能因为“看起来旧”就删。
- `EXEC/Geometry/` 和 `EXEC/Fuels/` 是几何和化学输入。
- `EXEC/*.d` 是直接输入文件，不是临时文件。
- `EXEC/coast` 和 `EXEC/coast_remap` 分别是求解器和 C++ remap 生产后端。

### Visit 输出的清理

`EXEC/Visit/solution.visit` 本身只是索引文件，它引用许多 `solution.<step>.domain.<rank>.vtk` 文件。只删 `.visit` 或只删 VTK 都会让结果不完整。

清理 Visit 前先估算大小：

```bash
cd /path/to/Coast_software
du -sh EXEC/Visit
find EXEC/Visit -maxdepth 1 -type f | wc -l
```

如果用户确认结果已经归档或不需要，才能清理。清理前最好先创建 archive 或明确记录删除原因。

### 移植前整理成干净工作区

如果目标是把非封装版工作区搬到另一台机器，推荐保留这些目录和文件：

```text
SRC.Coast/
EXEC/
docs/
scripts/
templates/
tests/
codegraphf_portable/
dist/coast_portable_latest/
README.md
SKILL.md
```

其中 `EXEC/` 只应保留当前程序和可复用算例资产，例如：

```text
EXEC/coast
EXEC/*.d
EXEC/Geometry/
EXEC/Fuels/
EXEC/runtime_mesh/
EXEC/Decomp/
EXEC/injector/
EXEC/chemistry_accel_variants/
EXEC/Probes/
EXEC/SPRAYs/
```

这些内容通常不应混在干净移植目录里，除非用户明确要带走历史结果或续算存档：

```text
EXEC/Restart/
EXEC/Visit/
EXEC/imbmesh/
EXEC/screen
EXEC/monitor/
EXEC/Mesh*.candidate/
EXEC/Mesh5.*target/
EXEC/Restart.remapped*/
EXEC/*.log
EXEC/*.json
EXEC/*.pid
EXEC/fort.*
```

更稳妥的做法是“移出”而不是直接删除。例如：

```bash
mkdir -p /path/to/Coast_software_archives/exec_cleanup_YYYYMMDD_HHMMSS
mv EXEC/Restart EXEC/Visit EXEC/screen /path/to/Coast_software_archives/exec_cleanup_YYYYMMDD_HHMMSS/ 2>/dev/null || true
```

本工作区在 2026-06-23 已按上述原则清理：求解器已经停止，`EXEC/Restart`、`EXEC/Visit`、旧候选网格、重映射 Restart、监控输出和临时报告已经移到：

```text
/home/wyf/code_dev/Coast_software_archives/exec_cleanup_20260623_111259
```

因此当前 `EXEC` 是“干净运行资产目录”，不是“可直接续算目录”。如果 `EXEC/input.d` 仍是 restart 模式，重新运行前必须先把匹配的 `Restart/` 还原回来，或者把输入改成 fresh-start/重新点火路径，并重新确认 rank 数、网格身份和边界设置。

特别说明：这次被停止的长测中，火焰没有稳定锚定在回流区附近，不能作为稳定燃烧验收结论。后续需要重新检查点火位置、燃料/空气边界、局部网格和化学加速设置，再做新的稳定性验证。

## 10.6 失败排查顺序

当运行失败或结果异常时，推荐按下面顺序看：

1. `./coastctl monitor --case-dir EXEC --json`，尤其是 `stdoutLog`、`stderrLog` 和 `errorSummary`。
2. 外部 `.coast_run_logs/` 中 monitor 指向的 stdout/stderr 和 run manifest。
3. `EXEC/screen`，这是主要屏幕日志。
4. `EXEC/input.d`、`EXEC/boundary_conditions.d`、`EXEC/vtk_output.d`、`EXEC/spray.d`、`EXEC/spark.d`、`EXEC/probe.d`、`EXEC/heat_release.d`。
5. `EXEC/ibm_mesh.d` 和当前 `EXEC/runtime_mesh/` 状态。
6. `SRC.Coast/` 源代码。

查看日志末尾：

```bash
cd /path/to/Coast_software
./coastctl monitor --case-dir EXEC --json
tail -120 EXEC/screen
```

stdout/stderr 的实际文件请从 `monitor` 输出里的 `stdoutLog` 和 `stderrLog` 字段读取。

开发/AI agent 在改源码前，应该先记录失败现象、最后的日志、输入设置和当前 mesh/Restart 状态。很多失败来自输入、rank 数、Restart 文件数、边界选择为空或网格身份不匹配，不一定需要改求解器源码。

## 10.7 最后几条红线

这些规则值得重复：

- 不要恢复旧的 `boffin`、`config_boffin`、`coast-solver`、`coast-solver-TCR` 命名到活跃源码、脚本或可执行路径。
- 不要把 Mesh-4 候选预览文件当成活动求解网格。
- 不要把 Mesh-5 自动加密候选直接复制到 `EXEC/runtime_mesh`。
- 不要为生产运行启用 `mesh_regrid.mode='dynamic'` 或 `mode='conservative_transfer'`。
- 不要用 `boundary_conditions.d` 把固体格子强行变成流体。
- 不要在未确认 rank、Restart、PDF Restart 和 runtime mesh 文件数匹配时启动 Restart 运行。
- 不要在运行中删除 `EXEC/Restart`、`EXEC/runtime_mesh`、`EXEC/Decomp` 或 `EXEC/screen`。
- 不要手工打包运行目录，必须通过 `coastctl package build`。

守住这些红线，非封装版工作区就能同时服务普通运行、开发验证、AI agent 协作和便携发布。

