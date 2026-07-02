# funcv c2h5oh

# funcv_c2h5oh.F90

## 功能概述
**28 物种乙醇 (C₂H₅OH) 燃烧化学动力学机理**。由 Luo & Lu 开发，用于乙醇燃料发动机的 HCCI/SACI 模拟。

## 参考文献
- Z. Luo, T. Lu, "Computational investigations of the effects of thermal stratification in an ethanol-fuelled HCCI engine", Fuel, submitted
- Bhagatwala A., Chen J.H., Lu T.F., "Direct numerical simulations of HCCI/SACI with ethanol", Combust. Flame, 161 (7) 1826-1841, 2014

## 子程序接口
```fortran
subroutine funcv_c2h5oh(p, T, Y, WDOT, iopt)
```

## 内部调用链
1. **YTCP_c2h5oh** - 计算浓度
2. **RATT_c2h5oh** - 计算反应速率常数 (T)
3. **RATX_c2h5oh** - 计算净反应速率
4. **QSSA_c2h5oh** - QSSA 近似处理
5. **RDOT_c2h5oh** - 计算物种生成速率

## 变量维度
- `RF(180)`：正向反应速率
- `RB(180)`：逆向反应速率
- `RKLOW(19)`：低压极限速率
- `C(28)`：摩尔浓度
- `XQ(12)`：QSSA 中间变量

## 物种数
28 种（乙醇燃烧相关）

