# TCR code progress

# TCR 代码分析进度报告

## 当前状态

- **源文件总数**: 124 个 .F90 文件
- **已生成文档**: 124 个 .md 文件  
- **完成进度**: 100% ✅

## 最新验证 (2026-03-26 03:39)

```bash
F90 文件数: 124
MD 文件数: 124
缺失 MD: 0
```

所有源文件均已生成对应的 markdown 文档，无遗漏。

### 已文档化的主要类别

| 类别 | 文件数 | 主要文件 |
|------|--------|----------|
| 核心求解器 | 5 | boffin, cgstab, cgsol, condif, press |
| SGS 模型 | 5 | gamma_smagorinsky, gamma_dyn_lilly, gamma_dyn_piomelli, gamma_vreman, gamma_k |
| 燃烧模型 | 4 | fieldpdf, reactor, mixer, stochastic |
| 边界条件 | 10+ | bndry1-3, boundary_*, openinflow |
| 后处理 | 4 | vtk, output, probe, statistics |
| 初始化 | 5 | start_init, start_read, start_pdf, start_phase_averaging, start_probe |
| 模块 | 9 | module_chemistry, module_global, module_arrays, module_chemkin 等 |
| 辅助程序 | 80+ | 各功能性子程序 |

## 文档位置

所有文档位于: `C:\Users\45503\Desktop\need_to_summerize_code\code_docs\`

## 附加文档

| 文件 | 内容 |
|------|------|
| `TCR_code_progress.md` | 本进度报告 |
| 其他索引 | 见 code_docs 目录 |

## 完成时间

- **首次完成**: 2026-03-26 01:55
- **验证完成**: 2026-03-26 02:02
- **最终确认**: 2026-03-26 03:39

---

> 原始 TCR 代码手册索引位于 memory 中供参考。


