# ewt pdf

# ewt_pdf.F90 - PDF Field Error Weight

## 概述

`ewt_pdf` 子程序计算随机场（stochastic field）变量的误差权重范数。与 `ewt` 类似，但针对 PDF 变量。

## 调用关系

- **调用者**: `boffin.F90` 主程序
- **使用模块**: `arrays`, `chemistry`, `exchange`, `global`, `sgs_pdf`

## 算法原理

### 遍历所有随机场

```fortran
do ifld = 0, nfield    ! 0 = 滤波值, 1~nfield = 随机场
  do isp = 1, nsc      ! 标量数量
    nv = nf + ifld*nsc + isp
    rnorm(nv) = max((ρ * f)²)
  end do
end do
```

### 范数计算

```fortran
rnorm(nv) = sqrt(rnorm(nv)) / rtime
```

## 索引映射

| ifld | 含义 |
|------|------|
| 0 | 滤波值 (filtered mean) |
| 1~nfield | 第 ifld 个随机场样本 |

变量索引：
- `nv = nf + ifld * nsc + isp`
- `nf` - 滤波变量数
- `nsc` - 标量数
- `isp` - 物种索引

## MPI 并行

使用 `MPI_MAX` 归约获取全局最大值。

## 与 ewt.F90 对比

| 特征 | ewt | ewt_pdf |
|------|-----|---------|
| 变量 | 滤波变量 | 随机场变量 |
| 范数类型 | 混合 | 最大范数 |
| 归约方式 | 压力用SUM | 全用MAX |

