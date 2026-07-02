# boffin

# boffin.F90

## 功能概述
**TCR求解器主程序**，整合所有模块实现LES-TPDF湍流燃烧模拟。主程序负责初始化、时间步循环、求解器调用和输出控制。

## 程序结构

### 1. 初始化阶段
```fortran
call input        ! 读取输入参数
call janaf_input  ! 读取热力学数据
call geom         ! 计算网格几何
call inprofile    ! 用户自定义初始/入口条件
call start_init   ! 初始化流场 (若非重启)
call start_probe  ! 初始化探针
call start_pdf    ! 初始化PDF方法
call start_phase_averaging  ! 相平均初始化
```

### 2. 时间步循环
```fortran
do while (istep < istep_end .and. time < time_end)
    ! 1. 保存旧时刻数据
    ! 2. 入口边界条件
    ! 3. 亚格子模型 (gamma_*)
    ! 4. CFL计算和时间步调整
    ! 5. PDF/燃烧计算 (fieldpdf, reactor)
    ! 6. 动量方程求解 (condif → cgstab)
    ! 7. 压力修正 (press → cgsol → update)
    ! 8. 后处理 (statistics, probe, minmax)
    ! 9. VTK/输出
end do
```

## 关键变量

### 指针关联
```fortran
u => f(nvu)  ! X方向速度
v => f(nvv)  ! Y方向速度
w => f(nvw)  ! Z方向速度
dp=> f(nvdp) ! 压力修正
vx => fbar(nvu)  ! 滤波速度X
```

### 核心控制变量
| 变量 | 说明 |
|------|------|
| `istep` | 当前时间步 |
| `time` | 物理时间 |
| `cfl` | CFL数 |
| `pdf` | PDF方法开关 |
| `ignite` | 点火开关 |

## 调用关系图

```
boffin
├── input           (参数输入)
├── janaf_input     (热力学)
├── geom            (几何)
├── inprofile       (初始/入口)
├── start_init/read (初始化)
├── fieldpdf        (PDF方法)
├── reactor_*      (化学反应)
├── condif         (对流扩散)
├── cgstab         (动量求解)
├── press          (压力方程)
├── update         (速度更新)
├── statistics     (统计)
├── probe          (探针)
└── vtk/output     (输出)
```

## 编译选项
```fortran
#undef constant_time_step  ! 固定时间步长（默认关闭）
```

## 依赖模块
- `arrays`：主数组
- `chemistry`：化学反应
- `digital_turbulence`：数字湍流
- `exchange`：MPI通信
- `global`：全局变量
- `sgs_pdf`：SGS和PDF模型
- `spark_module`：点火模型

