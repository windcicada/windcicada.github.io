# COAST - 湍流-化学混合模拟软件


## 概述

**COAST** (Chemistry Optimized Algorithmic Solver for Turbulence) 是一款面向湍流燃烧大规模并行数值模拟的专业软件，基于 LES-TPDF 方法框架，集成了高阶浸没边界方法 (IBM)、多种湍流模型、详细化学反应机理求解、欧拉-拉格朗日喷雾模拟等核心功能模块。

## 特色

- **LES-TPDF 耦合求解**：大涡模拟与输运概率密度函数方法相结合，精确描述湍流-化学反应相互作用
- **高阶浸没边界方法**：支持复杂几何外形的直角网格模拟，无需贴体网格
- **ESF 随机场求解器**：高效求解标量联合 PDF 输运方程
- **多层分区微混合模型**：TCR 模型 – 湍流-化学递归混合模型，无需经验标定参数
- **详细化学反应机理**：支持 ARM2、Red19 等多种甲烷/燃料机理，支持 DVODE 刚性求解器
- **并行可扩展**：基于 MPI 分布式并行，支持数百至数千核心高效运行

## 软件下载

[⬇️ 下载 COAST 便携运行包 (v2026.06, Linux x86_64)](/downloads/coast-runtime.tar.gz)

> 封装版约 6.8 MB，适用于 Linux x86_64 服务器。解压后包含求解器、coastctl 工具、UI、模板算例及完整文档。

## 系统要求

- Linux x86_64 服务器或工作站
- Python 3 (coastctl / assistant 工具)
- MPICH / OpenMPI (`mpirun`)
- 推荐 64+ 核心 / 128 GB+ 内存用于生产计算

## 快速入门

```bash
# 解压
tar -xzf coast-runtime-<version>-linux-x86_64.tar.gz
cd coast-runtime-<version>-linux-x86_64

# 加载环境
source env/coast-env.sh

# 检查工具
bin/coastctl doctor --case-dir EXEC_TEMPLATE --json

# 创建算例
cp -a EXEC_TEMPLATE EXEC.demo
bin/coastctl case validate --case-dir EXEC.demo --json

# 启动运行前检查
bin/coastctl run --case-dir EXEC.demo --ranks 128 --preflight --write --json

# 启动短测
bin/coastctl run --case-dir EXEC.demo --ranks 128 --execute --preflight --write --json

# 监控运行
bin/coastctl monitor --case-dir EXEC.demo --json
```

> **注意**：以上 rank 数 (128) 仅为示例，实际应以算例 Decomp/Restart 分块数为准。

## 用户手册

完整的 COAST 用户手册包含以下章节：

- 封装版环境配置
- 算例创建与修改
- 边界条件设置
- 运行计算（短测/正式/续算）
- 查看和导出结果
- 常见问题排查

[📖 阅读 COAST 用户手册](../coast-software/manual/)

## 相关链接

- [学术成果](../awards/) — COAST 相关论文与软著
- [LES-TPDF 湍流燃烧理论基础](../posts/les-tpdf-湍流燃烧理论基础/) — 方法背景
- [TCR 微混合模型](../posts/tcr_micro_mixing_model/) — 核心创新模型

---

*COAST 由北京航空航天大学湍流燃烧团队开发维护。*

