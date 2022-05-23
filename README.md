本项目为 https://github.com/SilveryStar/Adachi-BOT 衍生插件，用于订阅热点新闻，使用的是 [AnyKnew](https://www.anyknew.com/#/) 网站的API。

## 安装

在 `src/plugins`目录下使用下面的命令

### 网好用这个

```sh
git clone https://github.com/BennettChina/hot-news.git
```

### 网差用这两个

```shell
git clone https://ghproxy.com/https://github.com/BennettChina/hot-news.git
```

需要注意的时 `GitClone` 镜像同步比较慢(夜间同步)，因此如果 `pull` 时未拉取到内容可将插件删掉用 `Ghproxy` 重新克隆。

```shell
git clone https://gitclone.com/github.com/BennettChina/hot-news.git
```

> 感谢[GitClone](https://gitclone.com/) 和 [GitHub Proxy](https://ghproxy.com/) 提供的镜像服务！

## 使用方法

在需要订阅新闻的群里或者好友聊天对话中使用(群里仅BOT管理员可用)

```
# 订阅新闻(使用默认的头条新闻)
命令: <header> subscribe_news
范围: 群/私聊
权限: 用户 (User)

# 订阅新闻(选择新闻来源),可选：[新浪｜百度｜头条｜网易｜知乎]
命令: <header> subscribe_news 新浪
范围: 群/私聊
权限: 用户 (User)

# 订阅原神
命令: <header> subscribe_news 原神
范围: 群/私聊
权限: 用户 (User)

#取消订阅(选择服务),可选服务：[新闻｜原神]，默认取消新闻服务
命令: <header> unsubscribe_news
范围: 群/私聊
权限: 用户 (User)

# 限制原神动态推送：设置一个时间（单位：小时），发布时间过去该时间的动态将不再推送（常规情况不需要设置，服务器经常出现长时间满负载导致推送失败才需要考虑设置该值）。
命令: <header> lgdn 6
范围: 群/私聊
权限: 用户 (User)
```

## 更新日志

- 2022/05/23 截图改为截默认的PNG图（经过缓存优化，不再频繁截图，性能应该不成问题，jpeg图还是太糊了）。
- 2022/05/23 修复动态只会推送给单个用户或者群聊的问题；将动态截图缓存起来，不再每个用户再截图一次，减少截图次数。
- 2022/05/23 修复热点新闻的定时任务时间错误问题。
- 2022/05/22 重构代码，是代码更整洁方便阅读。增加 `#lgdn` 指令指定原神动态过时时间，发布时间过去该时间的动态将不再推送（常规情况不需要设置，服务器经常出现长时间满负载导致推送失败才需要考虑设置该值）。
- 2022/05/20 修复渲染图片出错时异常栈信息未打印导致无法分析问题
- 2022/05/17 （⚠️ 本次更新依赖于BOT项目的 `2.3.6` 版本，请确保你的BOT项目版本为 `2.3.6` 以上）
    + api调用增加缓存
    + 启动浏览器使用重构后的方式，其他插件使用同一个浏览器
- 2022/05/16 修复因为B站审核问题导致动态时间错误判断而无法推送的问题。
- 2022/05/13 增加B站原神动态订阅
- 2022/04/14 新闻推送时间优化为8:30~9点。
- 2022/04/14 修复初始权限太高导致私聊订阅常规用户无法订阅的问题，改为群里使用管理员权限，私聊使用常规用户权限。

## 感谢

- 感谢 [AnyKnew](https://www.anyknew.com/#/) 站长提供的API

## 问题汇总

- 字体缺少导致的B站动态截图中有方块，解决方案就是安装中文字体。

<details>
<summary>Linux 使用 pm2 启动的方式</summary>
这里仅给出 Centos 和 Ubuntu 的文泉译微软雅黑字体安装命令，其他系统可百度搜索下

- Centos

```shell
yum makecache && yum -y install wqy-microhei-fonts
```

- Ubuntu

```shell
apt install -y --force-yes --no-install-recommends fonts-wqy-microhei
```

</details>

<details>
<summary>Docker 启动方式使用下面的 Dockerfile 文件</summary>

```dockerfile
FROM silverystar/centos-puppeteer-env

ENV LANG en_US.utf8
RUN ln -snf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime  \
    && yum install -y git  \
    && npm config set registry https://registry.npmmirror.com \
    && yum makecache && yum -y install wqy-microhei-fonts

COPY . /bot
WORKDIR /bot
RUN npm i puppeteer --unsafe-perm=true --allow-root
CMD nohup sh -c "npm i && npm run docker-start"
```

</details>