# TCR 代码文档索引


本文档索引了 TCR 求解器源代码生成的 123 个代码文档。

## 文档分类

### 求解器核心

| 文档 | 说明 |
|------|------|
| [boffin.md](/tcr-manual/boffin/) | 主程序 |
| [config_boffin.md](/tcr-manual/config_boffin/) | 配置子程序 |
| [input.md](/tcr-manual/input/) | 输入参数读取 |
| [boffin_stop.md](/tcr-manual/boffin_stop/) | 终止程序 |

### 线性求解器

| 文档 | 说明 |
|------|------|
| [cgstab.md](/tcr-manual/cgstab/) | Bi-CGSTAB 求解器 |
| [cgsol.md](/tcr-manual/cgsol/) | PCG 求解器 |
| [linsol.md](/tcr-manual/linsol/) | 线性求解器通用接口 |

### 离散格式

| 文档 | 说明 |
|------|------|
| [condif.md](/tcr-manual/condif/) | 对流-扩散离散 |
| [press.md](/tcr-manual/press/) | 压力方程构建 |
| [update.md](/tcr-manual/update/) | 速度压力更新 |
| [step.md](/tcr-manual/step/) | 时间步进 |

### 模块文件

| 文档 | 说明 |
|------|------|
| [module_global.md](/tcr-manual/module_global/) | 全局变量 |
| [module_arrays.md](/tcr-manual/module_arrays/) | 主数组 |
| [module_chemistry.md](/tcr-manual/module_chemistry/) | 化学模块 |
| [module_chemkin.md](/tcr-manual/module_chemkin/) | ChemKin 接口 |
| [module_exchange.md](/tcr-manual/module_exchange/) | MPI 通信 |
| [module_sgs_pdf.md](/tcr-manual/module_sgs_pdf/) | SGS/PDF 参数 |
| [module_digital_turbulence.md](/tcr-manual/module_digital_turbulence/) | 数字湍流 |
| [module_spark.md](/tcr-manual/module_spark/) | 点火模型 |

### 燃烧模型

| 文档 | 说明 |
|------|------|
| [fieldpdf.md](/tcr-manual/fieldpdf/) | 随机场 PDF 方法 |
| [mixer.md](/tcr-manual/mixer/) | TCR 混合模型 |
| [reactor.md](/tcr-manual/reactor/) | 反应计算 + MPI 负载均衡 |
| [react_hc.md](/tcr-manual/react_hc/) | 碳氢燃料反应求解 |
| [react_psr.md](/tcr-manual/react_psr/) | PSR 反应求解 |
| [stochastic.md](/tcr-manual/stochastic/) | 随机过程 (Wiener) |
| [source_pdf.md](/tcr-manual/source_pdf/) | PDF 源项 |
| [chemdot.md](/tcr-manual/chemdot/) | 反应率计算 |

### 亚格子模型

| 文档 | 说明 |
|------|------|
| [gamma_smagorinsky.md](/tcr-manual/gamma_smagorinsky/) | Smagorinsky 模型 |
| [gamma_dyn_lilly.md](/tcr-manual/gamma_dyn_lilly/) | 动态 Lilly 模型 |
| [gamma_dyn_piomelli.md](/tcr-manual/gamma_dyn_piomelli/) | 动态 Piomelli 模型 |
| [gamma_vreman.md](/tcr-manual/gamma_vreman/) | Vreman 模型 |
| [gamma_k.md](/tcr-manual/gamma_k/) | 湍流动能模型 |

### 边界条件

| 文档 | 说明 |
|------|------|
| [bndry1.md](/tcr-manual/bndry1/) | Dirichlet 边界 |
| [bndry2.md](/tcr-manual/bndry2/) | Neumann 边界 |
| [bndry2dp.md](/tcr-manual/bndry2dp/) | 压力修正 Neumann |
| [bndry3.md](/tcr-manual/bndry3/) | 速度边界 |
| [bndry3crn.md](/tcr-manual/bndry3crn/) | 速度角点处理 |
| [bndry_NSCBC.md](/tcr-manual/bndry_NSCBC/) | NSCBC 超声速边界 |
| [bndry_wall.md](/tcr-manual/bndry_wall/) | 壁面边界 |
| [boundary1.md](/tcr-manual/boundary1/) | 入口/出口 |
| [boundary2.md](/tcr-manual/boundary2/) | 第二类边界 |
| [boundary_wall.md](/tcr-manual/boundary_wall/) | 壁面边界 |
| [wall.md](/tcr-manual/wall/) | 壁面处理 |
| [wall_v.md](/tcr-manual/wall_v/) | 壁面速度 |

### 初始化

| 文档 | 说明 |
|------|------|
| [start_init.md](/tcr-manual/start_init/) | 流场初始化 |
| [start_read.md](/tcr-manual/start_read/) | 重启读取 |
| [start_pdf.md](/tcr-manual/start_pdf/) | PDF 初始化 |
| [start_probe.md](/tcr-manual/start_probe/) | 探针初始化 |
| [start_phase_averaging.md](/tcr-manual/start_phase_averaging/) | 相平均初始化 |
| [inprofile.md](/tcr-manual/inprofile/) | 入口分布 |
| [profile.md](/tcr-manual/profile/) | 剖面输入 |

### 后处理

| 文档 | 说明 |
|------|------|
| [statistics.md](/tcr-manual/statistics/) | 湍流统计 |
| [output.md](/tcr-manual/output/) | 输出信息 |
| [probe.md](/tcr-manual/probe/) | 探针输出 |
| [minmax.md](/tcr-manual/minmax/) | 极值计算 |
| [vtk.md](/tcr-manual/vtk/) | VTK 输出 |

### 物性与热力学

| 文档 | 说明 |
|------|------|
| [viscos.md](/tcr-manual/viscos/) | 分子粘度 |
| [temperature.md](/tcr-manual/temperature/) | 温度 |
| [enthalpy.md](/tcr-manual/enthalpy/) | 焓 |
| [densty.md](/tcr-manual/densty/) | 密度 |
| [equilb.md](/tcr-manual/equilb/) | 平衡 |
| [speedofsound.md](/tcr-manual/speedofsound/) | 声速 |
| [compress.md](/tcr-manual/compress/) | 可压缩性 |

### MPI 并行

| 文档 | 说明 |
|------|------|
| [pbsrhl.md](/tcr-manual/pbsrhl/) | MPI 通信主程序 |
| [pbconf.md](/tcr-manual/pbconf/) | MPI 配置 |
| [pbload.md](/tcr-manual/pbload/) | 负载加载 |
| [pexch.md](/tcr-manual/pexch/) | 并行交换 |

### 辅助工具

| 文档 | 说明 |
|------|------|
| [geom.md](/tcr-manual/geom/) | 网格几何 |
| [gradient.md](/tcr-manual/gradient/) | 梯度计算 |
| [locate.md](/tcr-manual/locate/) | 网格定位 |
| [jac.md](/tcr-manual/jac/) | Jacobian |
| [moment.md](/tcr-manual/moment/) | 动量 |
| [checkmass.md](/tcr-manual/checkmass/) | 质量守恒检查 |

### 燃料模型

| 文档 | 说明 |
|------|------|
| [funcv_4.md](/tcr-manual/funcv_4/) | 通用燃料函数 |
| [funcv_h2.md](/tcr-manual/funcv_h2/) | 氢气 |
| [funcv_ch4_arm2.md](/tcr-manual/funcv_ch4_arm2/) | 甲烷 (ARM2) |
| [funcv_ch4_red19.md](/tcr-manual/funcv_ch4_red19/) | 甲烷 (RED19) |
| [funcv_c2h4.md](/tcr-manual/funcv_c2h4/) | 乙烯 |
| [funcv_c2h5oh.md](/tcr-manual/funcv_c2h5oh/) | 乙醇 |
| [funcv_c7h16.md](/tcr-manual/funcv_c7h16/) | 庚烷 |
| [funcv_ch3oh.md](/tcr-manual/funcv_ch3oh/) | 甲醇 |

### 其他

| 文档 | 说明 |
|------|------|
| [janaf_input.md](/tcr-manual/janaf_input/) | 热力学数据读取 |
| [source.md](/tcr-manual/source/) | 通用源项 |
| [souru.md](/tcr-manual/souru/) | 动量源项 |
| [vls.md](/tcr-manual/vls/) | TVD 限制器 |
| [gam_tvd.md](/tcr-manual/gam_tvd/) | TVD 扩散系数 |
| [ignition.md](/tcr-manual/ignition/) | 点火 |
| [courant.md](/tcr-manual/courant/) | CFL 计算 |

---

*共 123 个文档*

