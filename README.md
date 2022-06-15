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

# 订阅B站某UP主(使用UP主的uid)
命令: <header> subscribe_news 2920960
范围: 群/私聊
权限: 用户 (User)

#取消订阅(选择服务),可选服务：[新闻｜原神|UP主的uid]，默认取消新闻服务
命令: <header> unsubscribe_news
范围: 群/私聊
权限: 用户 (User)

# 限制B站动态推送(默认为24小时)：设置一个时间（单位：小时），发布时间过去该时间的动态将不再推送
（常规情况不需要设置，服务器经常出现长时间满负载导致推送失败才需要考虑设置该值）。
命令: <header> lgdn 6
范围: 群/私聊
权限: 用户 (User)

# 查看订阅的信息
命令: <header> mysl
范围: 群/私聊
权限: 用户 (User)
```

## 插件配置

`cron` 表达式不会用的可在 [Cron表达式生成器](https://www.bejson.com/othertools/cron/) 里生成

```yaml
# 用户的最大订阅数量
maxSubscribeNum: 5
# B站动态查询定时任务规则(cron表达式)
biliDynamicScheduleRule: 0 0/3 * * * *
# B站直播查询定时任务规则(cron表达式)
biliLiveScheduleRule: 0 0/3 * * * *
# B站动态API信息缓存时间（秒），该时间必须小于动态的轮询间隔时间
biliDynamicApiCacheTime: 175
# B站直播API信息缓存时间（秒），该时间必须小于动态的轮询间隔时间
biliLiveApiCacheTime: 175
# B站动态截图缓存时间（秒），该时间必须小于动态的轮询间隔时间
biliScreenshotCacheTime: 60
# B站直播状态缓存时间（小时），在此时间内不会再次推送该直播间
biliLiveCacheTime: 8
```

## 更新日志

- 2022/06/15 修复直播频繁推送的问题。
- 2022/06/14 插件B站订阅查询任务配置化，可自行配置定时任务的执行规则。
- 2022/06/12 插件的订阅管理支持控制台管理（依赖 `BOT` 的 `2.4.1` 版本 ）
- 2022/06/07 优化 `#mysl` 指令，返回的 B 站订阅 UP 列表加入该 UP 的 uid 。
- 2022/06/03 增加 `#mysl` 指令查看用户订阅的信息。
- 2022/05/30 修复清理旧版本原神的订阅数据时未完全将旧订阅数据添加到新的 `key` 中（已升级的用户解决方案是重新订阅 `原神` ）。
- 2022/05/28 修复无法使用指令刷新配置、直播推送bug、初始化产生的缓存问题、取消B站订阅时会把该用户所有B站订阅都取消的问题；
- 2022/05/28 B站的订阅改为多选，可通过订阅up的uid来实现订阅该up的动态和直播
    + 增加 `hot_news.yml` 配置文件，通过 `maxSubscribeNum` 设置每个用户B站订阅数量的最大值，默认为5个。
    + 限制B站动态推送的默认值设置为24小时。
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