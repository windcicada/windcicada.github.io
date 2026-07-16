# Orange Pi Kunpeng Pro 双网口 OpenWrt 软路由配置实录


配套部署脚本已开源至
[windcicada/OrangePi_Kunpeng_Router](https://github.com/windcicada/OrangePi_Kunpeng_Router)。
仓库只保存可公开的脚本和简要说明；这篇文章是完整部署教程，包含硬件约定、执行顺序、
验收方法和失联恢复步骤。

> 本文记录一套已经在 Orange Pi Kunpeng Pro 上完成家庭 PPPoE、NAT、DHCP、DNS
> 和重启恢复验收的软路由配置。文中的账号、密码、物理 MAC 和公网地址均使用
> 占位符；请勿把设备上的真实配置直接提交到 Git。

## 1. 最终效果

这套方案不把 OpenWrt 直接刷进 Kunpeng Pro，而是保留厂商 openEuler 作为宿主，
再用 ARM64 KVM 虚拟机运行 OpenWrt。这样可以同时保留板级驱动，以及 OpenWrt 的
LuCI、UCI 和 firewall4 配置能力。

完成后：

- 光猫桥接，OpenWrt VM 负责 PPPoE、NAT、DHCP 和 DNS。
- Intel I226-V 网卡作为 WAN；Kunpeng Pro 板载 HNS3 网口作为 LAN。
- 小米路由器改为有线中继/AP，只负责 Wi-Fi 和交换，不再拨号、NAT 或发 DHCP。
- openEuler 宿主保留 `192.168.50.2` 救援地址；OpenWrt LuCI 为
  `http://192.168.50.1/`。
- 宿主断电重启后，双桥、libvirt 网络、OpenWrt VM 和 WAN 选择器自动恢复。

## 2. 拓扑与接口约定

```mermaid
flowchart LR
    ONT["光猫（桥接）"] --> PHYWAN["Intel I226-V<br/>宿主 eth0"]
    PHYWAN --> BWAN["openEuler br-wan<br/>无宿主 IP"]
    BWAN --> VMWAN["OpenWrt VM eth1<br/>DHCP / PPPoE"]
    VMWAN --> ROUTER["OpenWrt<br/>NAT / DHCP / DNS"]
    ROUTER --> VMLAN["OpenWrt VM eth0<br/>192.168.50.1/24"]
    VMLAN --> BLAN["openEuler br-lan<br/>192.168.50.2/24"]
    BLAN --> PHYLAN["板载 HNS3<br/>宿主 eth1"]
    PHYLAN --> AP["有线中继/AP"]
    AP --> CLIENTS["家庭终端<br/>192.168.50.100-249"]
```

| 层级 | 接口 | 角色 |
| --- | --- | --- |
| openEuler 宿主 | `eth0` / `igc` | Intel I226-V，物理 WAN |
| openEuler 宿主 | `eth1` / `hns3-platform` | 板载口，物理 LAN |
| openEuler 宿主 | `br-wan` | WAN 二层桥；不配置宿主 IPv4 |
| openEuler 宿主 | `br-lan` | LAN 二层桥；宿主救援地址 `192.168.50.2/24` |
| OpenWrt VM | `eth0` | 虚拟 LAN，MAC `52:54:00:50:00:01` |
| OpenWrt VM | `eth1` | 虚拟 WAN，MAC `52:54:00:50:00:02` |
| OpenWrt | `br-lan` | LAN 网关 `192.168.50.1/24` |
| OpenWrt | `wan` | DHCP 候选上游，默认由 `wan-mode` 控制 |
| OpenWrt | `wanpppoe` | PPPoE 候选上游，默认由 `wan-mode` 控制 |

宿主和虚拟机都可能出现 `eth0`/`eth1`，二者不是同一设备。不要根据网口名称猜测
物理端口；首次部署必须同时核对驱动、MAC 和拔插链路。

## 3. 已验证环境

| 组件 | 已验证版本/状态 |
| --- | --- |
| Kunpeng Pro 宿主 | openEuler 22.03 LTS-SP4，内核 `5.10.0+` |
| OpenWrt | 25.12.1，`armsr/armv8`，ext4 combined EFI |
| 虚拟化 | KVM/QEMU/libvirt，VM 2 vCPU、1 GiB RAM、4 GiB raw 磁盘 |
| Intel 网卡 | I226-V，PCI ID `8086:125c`，自建 `igc.ko` |
| LAN | `192.168.50.0/24`，DHCP `192.168.50.100-249` |
| PPPoE | MTU 1480、IPv4、默认路由和对端 DNS启用 |

OpenWrt 25.12 及更新版本使用 `apk` 包管理器，不再使用 `opkg`。OpenWrt 官方也明确
警告不要用 `apk upgrade` 对系统做盲目全量升级；系统升级应使用匹配版本的固件。

## 4. 硬件和救援条件

准备：

- Kunpeng Pro、电源、散热、可启动的 TF 卡和 eMMC。
- M.2 M Key/B+M Key、PCIe x1 的 Intel I226-V 网卡。
- Micro USB 调试线，串口参数 `115200 8N1`。
- 一台有有线网口的电脑。
- 处于桥接模式的光猫、运营商 PPPoE 凭据。
- 作为下游 AP 的路由器或交换机。

所有桥接切换、写盘和首次 VM 网络配置都应在 HDMI/键盘或串口可用时执行。SSH
断开不等于系统死机；网络切换过程中失去远程入口是正常风险。

## 5. 获取镜像并写入 eMMC

1. 从 [Orange Pi Kunpeng Pro 官方资料页](https://www.orangepi.cn/html/hardWare/computerAndMicrocontrollers/service-and-support/Orange-Pi-kunpeng.html)
   获取 Kunpeng Pro 对应的 openEuler 镜像、手册和源码。
2. 用 TF 卡启动，确认根分区确实是 `/dev/mmcblk1p1`，eMMC 是
   `/dev/mmcblk0` 且未挂载。
3. 对下载文件执行 `sha256sum` 和 `xz -t`，并记录哈希。
4. 使用 [`05-flash-emmc.sh`](https://github.com/windcicada/OrangePi_Kunpeng_Router/blob/main/scripts/kunpeng-router/05-flash-emmc.sh)：

```sh
IMAGE=/root/Kunpeng-openEuler.img.xz \
I_UNDERSTAND=YES \
bash ./05-flash-emmc.sh
```

该脚本会拒绝从非 TF 根系统写 eMMC，也会拒绝覆盖已挂载的目标。写入期间不得
断电、重启或拔卡。完成后正常关机，移除 TF 卡，切换为 eMMC 启动，再验收：

```sh
findmnt -no SOURCE /
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINTS,UUID
systemctl is-active sshd NetworkManager
```

预期根分区是 `/dev/mmcblk0p1`。

## 6. 恢复 Intel I226-V 驱动

原厂内核可枚举 `8086:125c`，但当前内核配置没有提供可加载的 IGC 模块。已验证的
做法是使用与运行内核严格匹配的完整开发树和 `Module.symvers`，只编译 IGC：

```sh
uname -r
lspci -nnk -s 01:00.0
test -f /usr/src/kernels/"$(uname -r)"/Module.symvers

bash ./00-build-igc.sh
```

脚本的核心命令是：

```sh
make -C /usr/src/kernels/"$(uname -r)" \
  M=drivers/net/ethernet/intel/igc CONFIG_IGC=m modules
```

成功后模块位于 `/lib/modules/$(uname -r)/extra/igc.ko`，并由
`/etc/modules-load.d/igc.conf` 开机加载。验收：

```sh
modinfo igc | grep -E 'filename|vermagic'
lspci -nnk -s 01:00.0
ip -br link
ethtool -i eth0
```

`vermagic` 必须与 `uname -r` 一致。出现 `Key was rejected`、未知符号或版本不匹配时
立即停止；不要使用 `--force` 强行加载。

### 板载 HNS3 的特殊依赖

Kunpeng Pro 板载口使用厂商 `hclgeplf.ko`，它依赖 Ascend 的 DFM、blackbox、QoS、
DMS 等符号，不能只靠标准内核的 `hns3.ko` 独立恢复。因此：

- 使用板载口时不要删除 `/var/davinci`，也不要屏蔽 `start-davinci.service`。
- 不要在远程会话里试卸载整套 Ascend 内核模块；这台板曾因此卡住重启。
- 某些厂商线程会使 Linux `load average` 很高，但 CPU 仍有 95% 以上空闲。判断性能
  要看 `top` 的 CPU idle、软中断、延迟和丢包，不能只看 load average。
- 如果必须彻底移除厂商栈，应放弃板载 HNS3，改用受主线内核支持的 USB 3.0
  RTL8153/AX88179 网卡作为 LAN。

## 7. 创建宿主双桥

先确认物理角色：

```sh
for i in eth0 eth1; do
  printf '%s mac=%s driver=' "$i" "$(cat /sys/class/net/$i/address)"
  basename "$(readlink -f /sys/class/net/$i/device/driver)"
  ethtool "$i" | grep -E 'Speed|Link detected'
done
```

在已验证硬件映射后运行：

```sh
WAN_IF=eth0 LAN_IF=eth1 LAN_HOST_CIDR=192.168.50.2/24 \
bash ./10-configure-host-bridges.sh
```

脚本只创建/修改配置，不会自动切断现有连接。它会输出需要从串口执行的激活命令。
激活前，应把占用 `eth0`/`eth1` 的旧 NetworkManager 配置设为不自动连接：

```sh
nmcli connection show
nmcli connection modify '<旧连接名>' connection.autoconnect no
```

然后从串口依次启用 LAN、WAN：

```sh
nmcli connection up br-lan
nmcli connection up br-lan-port ifname eth1
nmcli connection up br-wan
nmcli connection up br-wan-port ifname eth0
```

验收：

```sh
ip -br addr show br-wan
ip -br addr show br-lan
bridge link
nmcli -f NAME,TYPE,DEVICE,AUTOCONNECT connection show
```

正确状态是 `br-wan` 没有宿主 IPv4，`br-lan` 为 `192.168.50.2/24`，四个 bridge
和 port 配置均自动连接。宿主默认路由不应出现在 `br-wan`。

## 8. 创建 OpenWrt KVM 虚拟机

从 [OpenWrt 25.12.1 armsr/armv8 官方目录](https://downloads.openwrt.org/releases/25.12.1/targets/armsr/armv8/)
下载 `generic-ext4-combined-efi.img.gz` 并核对官方 SHA-256。本文验收版本的哈希是：

```text
43e04e13c03b191f666a64bf4a601fa7645bc7aacaca3a580b1b6f5394c74de3
```

未来发布新版本时应改用对应目录中当时的哈希，不要继续照抄旧值。

确认 KVM 和固件：

```sh
test -c /dev/kvm
ls -l /usr/share/edk2/aarch64/QEMU_EFI-pflash.raw
systemctl enable --now libvirtd
```

创建 VM：

```sh
IMAGE_GZ=/root/openwrt-25.12.1-armsr-armv8-generic-ext4-combined-efi.img.gz \
IMAGE_SHA256=43e04e13c03b191f666a64bf4a601fa7645bc7aacaca3a580b1b6f5394c74de3 \
bash ./20-create-openwrt-vm.sh
```

脚本会：

1. 将 ext4 EFI 镜像解压为 raw 磁盘并扩到 4 GiB。
2. 创建 `openwrt-lan -> br-lan` 和 `openwrt-wan -> br-wan` 两个纯桥接 libvirt 网络。
3. 创建 2 vCPU、1 GiB RAM、virtio 磁盘/网卡、AArch64 UEFI 的 VM。
4. 为 LAN/WAN 固定虚拟 MAC，设置 VM 和两个虚拟网络自动启动。
5. 打开串口控制台；退出控制台按 `Ctrl+]`。

libvirt 使用现有 Linux bridge 的方式可参阅其
[Network XML 官方文档](https://libvirt.org/formatnetwork.html)。

## 9. 配置 OpenWrt LAN、DHCP、PPPoE 和自动上游切换

把这些文件复制到 OpenWrt 的同一目录：

```text
30-configure-openwrt.sh
wan-mode
wan-mode.init
wanmode.uci
```

从 OpenWrt 串口执行：

```sh
sh ./30-configure-openwrt.sh
```

脚本会在终端中静默读取 PPPoE 密码，不把凭据写入脚本或命令行历史；如果已有值，
直接回车即可保留。首次网络 reload 后，管理地址会从 OpenWrt 默认地址变成
`192.168.50.1`。

`wan-mode` 的逻辑是：

1. `auto` 模式先启动 DHCP WAN。
2. DHCP 获得地址、默认路由且直连健康检查通过时，保持 DHCP。
3. DHCP 不健康时停止 DHCP，启动 PPPoE。
4. PPPoE 健康后保持连接；链路失效时重新选择。
5. 失败重试使用 30、60、120、300 秒退避，避免高频拨号。

命令：

```sh
wan-mode status
wan-mode dhcp
wan-mode pppoe
wan-mode auto
```

家庭长期使用保持 `auto` 即可。若不需要办公室/校园 DHCP 兼容，也可以固定执行
`wan-mode pppoe`。示例配置默认关闭校园认证；只有部署者另行提供
`/usr/sbin/wan-campus-auth` 并明确开启后才会调用。

### 关键防火墙修复：必须把 PPPoE 放进 WAN zone

这是整个部署中最容易遗漏、影响又最大的配置。OpenWrt 的防火墙 zone 按“逻辑
network 接口”分组，不是只按物理 `eth1` 分组。实际三层出口是
`pppoe-wanpppoe`，所以 WAN zone 必须包含 `wanpppoe`：

```sh
uci show firewall | grep -E "name='wan'|network=.*wanpppoe"
```

期望的配置语义：

```text
WAN zone networks: wan wan6 wanpppoe
WAN input: REJECT
WAN output: ACCEPT
WAN forward: DROP
WAN masquerading: enabled
WAN MTU fix: enabled
LAN -> WAN forwarding: enabled
```

遗漏 `wanpppoe` 时，普通 UDP 转发可能被 firewall4 丢弃，部分依赖 UDP 的应用会出现
高延迟或连接不稳定。修复后应重新检查 WAN zone、NAT、MSS 修正和 UDP 连通性。

OpenWrt 官方说明 zone 的 `network` 字段就是该 zone 包含的接口列表，WAN
masquerade 和 MSS clamping 也在 zone 级别生效。参阅
[OpenWrt firewall 配置文档](https://openwrt.org/docs/guide-user/firewall/firewall_configuration)。

不要执行 `uci show network.wanpppoe`，它会把账号和密码打印出来。只检查字段是否
存在：

```sh
test -n "$(uci -q get network.wanpppoe.username)" && echo username_present=yes
test -n "$(uci -q get network.wanpppoe.password)" && echo password_present=yes
```

## 10. 小米路由器切换为有线中继/AP

必须先让电脑直连 Kunpeng LAN，并确认 PPPoE、DHCP 和 DNS 全部正常，再调整小米：

1. Kunpeng 板载 LAN 接小米任一自动 WAN/LAN 口。
2. 先让小米使用 DHCP，确认它从 OpenWrt 获得 `192.168.50.x` 并能联网。
3. 再切换为“有线中继/AP”。
4. 终端应直接从 OpenWrt 获得地址，默认网关和 DNS 都是 `192.168.50.1`。
5. 在 OpenWrt 的 DHCP 租约中找到小米，必要时固定为 `192.168.50.3`。

小米不再 PPPoE、不再 NAT、不再发 DHCP。不要同时让 OpenWrt 和小米在同一 LAN 上
发 DHCP。

## 11. 自启和稳定性验收

宿主机：

```sh
bash ./90-verify-host.sh
systemctl is-enabled NetworkManager libvirtd
virsh net-list --all
virsh dominfo openwrt-router | grep -E 'State|Autostart'
```

OpenWrt：

```sh
sh ./91-verify-openwrt.sh
/etc/init.d/wan-mode enabled
```

做一次受控重启，重启后等待 1–2 分钟，再确认：

- `br-lan`、`br-wan` 和两个物理 port 都自动连接。
- `openwrt-lan`、`openwrt-wan` 和 `openwrt-router` 自动启动。
- `wan-mode status` 最终为 `active_mode=pppoe`、`last_result=ok`。
- LAN 终端能获取地址，DHCP、DNS 和普通 UDP 转发均正常。

这台板上 vendor D-state 线程可能抬高 load average。只要 CPU 大部分时间空闲、没有
持续 softirq 满核、丢包或明显延迟，2 vCPU/1 GiB 的 OpenWrt VM 对当前用途有足够
余量。

## 12. 备份、升级和回滚

### 备份

OpenWrt：

```sh
sysupgrade -b /tmp/openwrt-config-$(date +%Y%m%d).tar.gz
```

宿主：

```sh
virsh dumpxml openwrt-router > /root/openwrt-router.xml
virsh net-dumpxml openwrt-lan > /root/openwrt-lan.xml
virsh net-dumpxml openwrt-wan > /root/openwrt-wan.xml
nmcli connection show > /root/network-connections.txt
```

OpenWrt 备份可能含 PPPoE 密码和本机网络配置，只能加密离线保存，不能公开。

### 升级

- 不执行 `apk upgrade` 全量升级 OpenWrt。
- 升级前备份，使用同 target 的新固件，并确认自定义软件包与新版本兼容。
- 宿主内核变更后，旧 `igc.ko` 可能失配，必须用新内核的源码树和
  `Module.symvers` 重建。

### 网络失联恢复

1. 接入串口 `115200 8N1`，登录 openEuler。
2. 检查 `ip -br addr`、`nmcli device status`、`bridge link`。
3. 检查 `virsh domstate openwrt-router`；必要时 `virsh start openwrt-router`。
4. 用 `virsh console openwrt-router` 进入 OpenWrt；退出按 `Ctrl+]`。
5. 先恢复 `br-lan=192.168.50.2/24` 和 OpenWrt `192.168.50.1`，再处理 WAN。

### IGC 回滚

```sh
rm -f /etc/modules-load.d/igc.conf
rm -f /lib/modules/"$(uname -r)"/extra/igc.ko
depmod -a
reboot
```

如果 I226-V 无法稳定工作，使用受 Linux ARM64 支持的 USB 3.0 网卡替代，不要强制
加载失配模块。

## 13. 禁止事项

- 不把 PPPoE 账号、密码或设备导出的真实网络配置写进 Git。
- 不公开 `/etc/config/network`、`/etc/config/firewall` 或完整 OpenWrt sysupgrade 备份。
- 不把 `br-wan` 配成宿主管理口，不从 WAN 开放 LuCI/SSH。
- 不交换已确认的物理 WAN/LAN 角色，不把两个物理口加入同一个 bridge。
- 不强制加载 vermagic 不匹配或签名失败的内核模块。
- 不在使用板载 HNS3 时移除厂商 Ascend 驱动依赖。
- 不在缺少串口救援时执行桥接切换、驱动卸载或远程重启测试。
- 不用 load average 单一指标判断板子是否过载。

## 14. 发布前脱敏

只发布本目录和 `scripts/kunpeng-router/` 中列出的文件。不要把本机工作目录整体推送。
发布前执行：

```sh
rg -n -i \
  'password|passwd|username|authorized_keys|100\\.[0-9]+\\.|ENC:' \
  docs/kunpeng-router scripts/kunpeng-router
```

逐项确认命中只来自说明文字、变量名或占位符，没有真实值。还应人工检查公网 IP、
手机号、邮箱、物理 MAC、SSH 指纹和家庭 DDNS。

相关脚本采用 MIT License；教程正文可由发布网站按其内容许可处理。官方参考：

- [Orange Pi Kunpeng Pro 官方资料](https://www.orangepi.cn/html/hardWare/computerAndMicrocontrollers/service-and-support/Orange-Pi-kunpeng.html)
- [OpenWrt 25.12.1 armsr/armv8 下载目录](https://downloads.openwrt.org/releases/25.12.1/targets/armsr/armv8/)
- [OpenWrt apk 包管理器](https://openwrt.org/docs/guide-user/additional-software/apk)
- [OpenWrt firewall 配置](https://openwrt.org/docs/guide-user/firewall/firewall_configuration)
- [libvirt Network XML](https://libvirt.org/formatnetwork.html)

本文配套脚本和精简项目说明见
[OrangePi_Kunpeng_Router GitHub 仓库](https://github.com/windcicada/OrangePi_Kunpeng_Router)。

