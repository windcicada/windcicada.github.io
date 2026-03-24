# 个人网站搭建


# 网站搭建笔记

## 使用[HUGO](https://gohugo.io/)搭建网站

#### 1.使用[chocolatey](https://chocolatey.org/install)安装HUGO

**HUGO**

`choco install hugo -confirm`

**HUGO-Extended**

``choco install hugo-extended –confirm``

#### 2.初始化网站

在网站根目录下`hugo new site sitename`(其中sitename表示网站名)

#### 3.下载网站主题(以[LoveIt](https://github.com/dillonzq/LoveIt/)为例)

`cd themes`

`git clone https://github.com/dillonzq/LoveIt.git`

#### 4.本地调试

`hugo serve`

## 使用[Netlify](https://app.netlify.com/)运行网站

* 登录[Netlify](https://app.netlify.com/)并用github授权
* `Sites`->`New site from Git`
* 选择仓库
* `Deploy site`

## ~~使用Apache2运行网站~~

* 待补充

## 使用git调试和同步

* github创建仓库：用户名.github.io
* 本地网站主文件夹中`hugo --theme=LoveIt --baseUrl="https://用户名.github.io/" --buildDrafts`以创建public文件夹
* 本地用户根文件夹/.ssh（例如`C:\Users\Dong\.ssh`）中创建SSH密钥（例如`ssh-keygen -t rsa -C "wangyudong@buaa.edu.cn"`）,并传到github(设置-Access-SSH and GPG keys)
* * 本地public文件夹中git初始化（用户名以`windcicada`为例）
  * `git init`
  * `git add .`
  * `git commit -m "comments"`
  * `git remote add origin  git@github.com:windcicada/windcicada.github.io.git`
  * `git push -u origin master`



```Error Fix
无权限push时，修改项目目录下的.git/config，url改为https格式，相当于把git端口由22改为443
[remote "origin"]
	url = https://github.com/windcicada/windcicada.github.io.git
```



## loveIt主题模板配置

...

## 鼠标点击特效配置

...

## Live2D配置

#### 配置./layouts/partials/assets.html

文件末尾207行起：

```html
{{- /* 添加live2d看板娘 */ -}}

<script type="text/javascript" charset="utf-8"  src="https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.min.js"></script>

<script type="text/javascript">
    L2Dwidget.init({
        model: {
            scale: 1,
            hHeadPos: 0.5,
            vHeadPos: 0.618,
            //jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-hijiki@1.0.5/assets/hijiki.model.json'
            //jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-tororo@1.0.5/assets/tororo.model.json'
            //jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-miku@1.0.5/assets/miku.model.json'
            //jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-hibiki@1.0.5/assets/hibiki.model.json'
            jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-wanko@1.0.5/assets/wanko.model.json'
        },
        display: {
            superSample: 1,     // 超采样等级
            width: 120,         // canvas的宽度
            height: 300,        // canvas的高度
            position: 'left',   // 显示位置：左或右
            hOffset: 0,         // canvas水平偏移
            vOffset: 0,         // canvas垂直偏移
        },
        mobile: {
            show: true,         // 是否在移动设备上显示
            scale: 1,           // 移动设备上的缩放
            motion: true,       // 移动设备是否开启重力感应
        },
        react: {
            opacityDefault: 1,  // 默认透明度
            opacityOnHover: 1,  // 鼠标移上透明度
        },
     });
</script>
{{- /* from themes\LoveIt\layouts\partials\assets.html */ -}}

{{- partial "plugin/analytics.html" . -}}
```

~~*未完待续*~~

## 参考链接

[Live2D模型参考](https://huaji8.top/post/live2d-plugin-2.0/)

[雨临Lewis/Hugo系列](https://lewky.cn/categories/hugo%E7%B3%BB%E5%88%97/)


