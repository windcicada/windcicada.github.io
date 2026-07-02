# 北航自动网络认证


# 北航自动网络认证

## [WINDOWS](../images/GW_WINDOWS.zip)

### 主文件 gw_buaa.py

```python
# @file gw_buaa.py
# @author Dong
# @date 2022-01-25
# @email wangyudong@buaa.edu.cn
# @brief This is a python script to login the buaa network.
#        "pip install selenium" is required.
#         chromedriver.exe(https://chromedriver.chromium.org/downloads) is required.
#        "pip install urllib" maybe required.
from selenium import webdriver
import urllib.request
import urllib.error
import time 
import re
def logged_in():
    try:
        urllib.request.urlopen('https://www.baidu.com/', timeout=1)
        return True
    except urllib.error.URLError as err:
        return False
if __name__ == '__main__':
    while True:
        if not logged_in():
            opt=webdriver.ChromeOptions()
            #opt.add_argument('--headless')
            driver=webdriver.Chrome(executable_path='C:\Program Files\Google\Chrome\Application\chromedriver.exe',chrome_options=opt)
            driver.get('https://gw.buaa.edu.cn:801/')
            driver.find_element_by_id('username').send_keys('sy2004511')
            driver.find_element_by_id('password').send_keys('Password')
            driver.find_element_by_id('login').click()
        time.sleep(5)
```

### 使用前配置

1. 安装python及命令行pip安装selenium(`pip install selenium`)等。
2. 根据Chrome浏览器版本下载[chromedriver.exe](https://chromedriver.chromium.org/downloads)。
3. 修改gw_buaa.py中第25行的`C:\Program Files\Google\Chrome\Application\chromedriver.exe`路径为存放前一步下载的chromedriver.exe的路径。
4. 修改gw_buaa.py中第27行的用户名`sy2004511`。
5. 修改gw_buaa.py中第28行的密码`Password`。
6. 在源文件目录命令行运行`python gw_buaa.md`，或双击gw_buaa.bat脚本运行。

## [LINUX](../images/GW_LINUX.zip)

### 1. 新建system service

建立文件`/usr/lib/systemd/system/buaaConnect.service`

```service
[Unit]
Description=BUAA Connect Service
After=network.target syslog.target

[Service]
Type=idle
Restart=on-failure
RestartSec=5s
ExecStart=/etc/connect_loop.sh

[Install]
WantedBy=multi-user.target
```

### 2. 建立buaaConnect.service的执行目标

建立文件`/etc/connect_loop.sh`

```sh
#!/bin/bash
#systemctl: 2345 96 14
#########################################################################
# File Name: connect_loop.sh
# Author: Dong
# mail: wangyudong@buaa.edu.cn
# Created Time: 2022年01月17日 星期一 11时48分42秒
#########################################################################

while true
do
		/etc/buaa_connect/try-connect-v2.sh
		sleep 10
done
```

### 3. 建立单次执行目标

建立文件`/etc/buaa_connect/try-connect-v2.sh`

```sh
#!/bin/bash

online=$(curl -sS "https://gw.buaa.edu.cn/cgi-bin/rad_user_info")
grep "not_online_error" <<< $online > /dev/null
if [[ "$?" != "0" ]]; then
        echo online: $(cut -d, -f1 <<< $online)
        exit 1
fi

/etc/buaa_connect/login-v2.sh login

```

## 4. 修改/etc/buaa_connect/account为自己的账户

```account
USERNAME="sy2004511"
PASSWORD="PASSWORD"
```

## 5. 启动服务

```shell
$ sudo systemctl enable buaaConnect.service
$ sudo systemctl start buaaConnect.service
```
