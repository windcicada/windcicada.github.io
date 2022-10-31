# 北航自动网络认证


# 北航自动网络认证

## 主文件 gw_buaa.py

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

## 使用前配置

1. 安装python及命令行pip安装selenium(`pip install selenium`)等。
2. 根据Chrome浏览器版本下载[chromedriver.exe](https://chromedriver.chromium.org/downloads)。
3. 修改gw_buaa.py中第25行的`C:\Program Files\Google\Chrome\Application\chromedriver.exe`路径为存放前一步下载的chromedriver.exe的路径。
4. 修改gw_buaa.py中第27行的用户名`sy2004511`。
5. 修改gw_buaa.py中第28行的密码`Password`。
6. 在源文件目录命令行运行`python gw_buaa.md`，或双击gw_buaa.bat脚本运行。
