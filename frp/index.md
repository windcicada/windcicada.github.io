# FRP端口转发搭建


## frpc在Windows端的使用

### 1 修改`frpc.ini`

```ini
[common]
server_addr = 服务器地址
server_port = 服务器段frps.ini中开放的端口

[ssh]
type = tcp
local_ip = 127.0.0.1
local_port = 3389
remote_port = 服务器对外开放的端口
```

{{< admonition tip "对于 TND Server" false >}}
对于TND_SERVER：
[common]
server_addr = 服务器地址
server_port = 6001（或6002）

[ssh]
type = tcp
local_ip = 127.0.0.1
local_port = 3389
remote_port = 8001（或8002）
{{< /admonition >}}


### 2.1 利用VBS文件执行（推荐）

以微软远程桌面3389端口为例，假定`frpc.exe`的**路径为`C:\Users\Admin\Desktop\frpc.exe`**。创建文件`frp_rd.vbs`，其内容为：

```vbscript
set ws=WScript.CreateObject("WScript.Shell")
ws.Run "C:\Users\User\Desktop\frpc.exe -c C:\Users\Admin\Desktop\frpc.ini",0
```

若需实现开机自动启动，则用`WIN`+`R`运行`shell:startup`打开启动文件夹，并将文件`frp_rd.vbs`置于其中。

### 2.2 在frp所在目录中基于命令行运行

```Windows命令行
.\frpc -c .\frpc.ini
```

### 3 在其他设备上登录

登录地址(服务器地址设为000.000.000.000):

服务器地址:服务器对外开放的端口

{{< admonition tip "对于 TND Server" false >}}
登录地址：
服务器地址:8001（或8002）
{{< /admonition >}}

