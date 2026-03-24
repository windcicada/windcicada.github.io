# LES-BOFFIN 反应进度变量与燃烧模式诊断方法


# LES-BOFFIN 反应进度变量与燃烧模式诊断方法

> **作者**: 王煜栋  
> **更新**: 2026-03-23

---

## 1. 研究背景

在大涡模拟（LES）与概率密度函数（PDF）方法结合的湍流燃烧模拟中，准确诊断燃烧状态是一个重要课题。传统的混合分数方法虽然能有效描述非预混燃烧，但难以直接刻画反应进程和燃烧模式。

本文介绍一种基于**反应进度变量（Progress Variable）**的燃烧诊断方法。

---

## 2. 反应进度变量定义

对于丙烷（C₃H₈）空气燃烧，反应进度变量 $c$ 定义为：

$$c = \frac{X_{prod}}{X_{prod} + X_{react}}$$

其中：
- **产物摩尔分数**：$X_{prod} = 3X_{CO_2} + 4X_{H_2O} + X_{CO}$
- **反应物摩尔分数**：$X_{react} = X_{C_3H_8} + 0.2X_{O_2}$

物理意义：$c=0$ 表示纯反应物，$c=1$ 表示完全燃烧产物。

---

## 3. 关键参数计算方法

### 3.1 湍流脉动速度
$$u' = \sqrt{\frac{2k}{3}}$$

### 3.2 Karlovitz 数
$$Ka = \left(\frac{u'}{S_L}\right)^2 \cdot \frac{\delta}{l_t}$$

---

## 4. 燃烧模式分类

| 标志值 | 模式名称 | 判据 |
|--------|----------|------|
| 1 | 褶皱火焰面 | $\lg(u'/S_L) < 0$ |
| 2 | 波状火焰面 | $\lg(u'/S_L) \geq 0$ 且 $Ka < 1$ |
| 3 | 薄反应区 | $1 \leq Ka < 100$ |
| 4 | 破碎反应区 | $Ka \geq 100$ |

---

## 5. 标量 PDF 方差计算

$$\text{var}(\phi) = \frac{1}{N}\sum_{i=1}^{N} (\xi_i - \bar{\xi})^2$$

---

## 6. VTK 输出变量

- `Progress_variable_filtered` - 滤波反应进度变量
- `Progress_variable_instantaneous` - 瞬时反应进度变量
- `Karlovitz_number` - Karlovitz 数
- `Combustion_mode_flag` - 燃烧模式标志 (1-4)

---

该方法为 LES-TPDF 湍流燃烧模拟提供了有力的诊断工具。

