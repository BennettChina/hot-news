本项目为 https://github.com/SilveryStar/Adachi-BOT
衍生插件，用于订阅热点新闻，使用的是 [AnyKnew](https://www.anyknew.com/#/) 网站的API。

## 安装

在 `src/plugins`目录下使用下面的命令

### 网好用这个

```sh
git clone https://github.com/BennettChina/hot-news.git
```

### 网差用这两个

```shell
git clone https://gh-proxy.com/https://github.com/BennettChina/hot-news.git
```

需要注意的时 `GitClone` 镜像同步比较慢(夜间同步)，因此如果 `pull` 时未拉取到内容可将插件删掉用 `Ghproxy` 重新克隆。

```shell
git clone https://gitclone.com/github.com/BennettChina/hot-news.git
```

> 感谢[GitClone](https://gitclone.com/) 和 [GitHub Proxy](https://gh-proxy.com/) 提供的镜像服务！

## 使用方法

在需要订阅新闻的群里或者好友聊天对话中使用(群里仅BOT管理员可用)

```
# 订阅新闻(使用默认的头条新闻)
命令: <header> subscribe_news
范围: 群/私聊
权限: 用户 (User)

# 订阅新闻(选择新闻来源),可选：[新浪｜百度｜头条｜网易｜知乎|60秒新闻]
命令: <header> subscribe_news 新浪
范围: 群/私聊
权限: 用户 (User)

# 订阅摸鱼日报
命令: <header> subscribe_news 摸鱼
范围: 群/私聊
权限: 用户 (User)

# 订阅B站UP主
命令: <header> subscribe_news 原神
范围: 群/私聊
权限: 用户 (User)

# 订阅B站某UP主(使用UP主的uid)
命令: <header> subscribe_news 2920960
范围: 群/私聊
权限: 用户 (User)

#取消订阅(选择服务),可选服务：[新闻渠道｜UP名称|UP主的uid|摸鱼]
命令: <header> unsubscribe_news 头条
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

# 移除某群订阅的消息
命令: <header> rms [群号]
范围: 私聊
权限: BOT管理员 (Manager)

# 申请短信订阅
命令: <header> 订阅短信
范围: 私聊
权限: 用户 (User)

# 取消短信订阅
命令: <header> 取消订阅短信
范围: 私聊
权限: 用户 (User)
```

## 插件配置

`cron` 表达式不会用的可在 [Cron表达式生成器](https://www.bejson.com/othertools/cron/) 里生成

```yaml
# 用户的最大订阅数量
maxSubscribeNum: 5
# B站动态查询定时任务规则(cron表达式)
biliDynamicScheduleRule: 0 * * * * *
# B站直播查询定时任务规则(cron表达式)
biliLiveScheduleRule: 0 * * * * *
# B站动态API信息缓存时间（秒），该时间必须小于动态的轮询间隔时间
biliDynamicApiCacheTime: 55
# B站直播API信息缓存时间（秒），该时间必须小于动态的轮询间隔时间
biliLiveApiCacheTime: 55
# B站动态截图缓存时间（秒），该时间必须小于动态的轮询间隔时间
biliScreenshotCacheTime: 55
# B站直播状态缓存时间（小时），在此时间内不会再次推送该直播间
biliLiveCacheTime: 20
# B站直播推送的模版消息
liveTemplate: |-
    【直播通知】
    ${name}开播啦!
    标题：${title}
    在线人气：${num}
    开播时长：${liveTime}
    直播间：${url}
    ${img}
# B站常规动态推送的模版消息
dynamicTemplate: |-
    【动态通知】
    ${name}发布新动态了!
    动态地址：${url}
    ${img}
# B站专栏动态推送的模版消息
articleDynamicTemplate: |-
    【动态通知】
    ${name}发布新动态了!
    动态地址：${url}
    ${desc}
# B站视频动态推送的模版消息
videoDynamicTemplate: |-
    【投稿通知】
    ${name}发布新的投稿视频了!
    标题：${archive.title}
    简介：${archive.desc}
    视频地址：${archive.jump_url}
    ${img}
# B站动态截图渲染失败的模版消息
errorMsgTemplate: |-
    ${name}发布新动态了
    动态地址：${url}

    图片渲染出错了，请自行前往B站查看最新动态。
# 截图的类型（1是直接截B站的图，2是截自定义带二维码的图）
screenshotType: 1
# 摸鱼日报订阅配置
subscribeMoyu:
    enable: false
    cronRule: 0 0 9 * * *
    # 1代表使用韩小韩的接口，2代表使用"妥妥的"的接口(1仅国内使用，比较稳定；2国内海外都可用，不是很稳定。)
    apiType: 1
# 推送限制配置
pushLimit:
    enable: true
    # 次数限制，即每推送几个用户后延迟推送后续消息
    limitTimes: 3
    # 延迟的时间(单位：秒)
    limitTime: 2
# 韩小韩API的CDN（由于该站长未开启海外IP的可用，因此需要自行部署CDN来代理他的API，没有域名的可以使用我为你们提供的CDN）
vvhanCdn: "https://vvhan.hibennett.cn"
aliases:
    - 消息订阅
    - 新闻订阅
    - 热点新闻
# 过滤动态内容的正则，不需要过滤则设置为空
filterContent: "恭喜.*中奖"
# 按照动态类型进行过滤，可用类型参考下文
filterDynamicType:
  - type: DYNAMIC_TYPE_FORWARD
    reg: 互动抽奖
# B站个人已登录的Cookie
cookie: ""
# 短信订阅webhook服务使用的域名
apiDomain: ""
```

### 模版消息配置

<details>

<summary>配置详情，点击展开</summary>

#### 直播推送的模版消息参数

| 参数           | 描述                  | 备注          |
|:-------------|:--------------------|:------------|
| `name`       | UP名称                |             |
| `uid`        | UP的UID              |             |
| `title`      | 直播间标题               |             |
| `url`        | 直播间链接               |             |
| `img`        | 直播间封面的              |             |
| `num`        | 直播间人气值              | 具体的数值:19911 |
| `liveTime`   | 开播时长                | 2:30:12     |
| `text_small` | 直播间人气值字符串           | 大致值：1.9万    |
| `text_large` | 带描述的人气值字符串，示例：100人气 | 1.9万人看过     |

#### 常规动态的模版消息参数

| 参数            | 描述       | 备注                 |
|:--------------|:---------|:-------------------|
| `id`          | 此动态的ID   | 感觉用不到              |
| `name`        | UP名称     |                    |
| `uid`         | UP的UID   |                    |
| `pub_time`    | 动态的发布时间  | 粗略的，比如：昨天          |
| `pub_tss`     | 动态的发布时间  | 详细的时间，根据时间戳转化后的字符串 |
| `like_num`    | 点赞数      |                    |
| `comment_num` | 评论数      |                    |
| `forward_num` | 转发数      |                    |
| `url`         | 此动态的访问链接 |                    |
| `img`         | 动态的截图    |                    |

#### 直播动态的模版消息参数

| 参数            | 描述       | 备注                 |
|:--------------|:---------|:-------------------|
| `id`          | 此动态的ID   | 感觉用不到              |
| `name`        | UP名称     |                    |
| `uid`         | UP的UID   |                    |
| `pub_time`    | 动态的发布时间  | 粗略的，比如：昨天          |
| `pub_tss`     | 动态的发布时间  | 详细的时间，根据时间戳转化后的字符串 |
| `like_num`    | 点赞数      |                    |
| `forward_num` | 转发数      |                    |
| `url`         | 此动态的访问链接 |                    |
| `img`         | 动态的截图    |                    |

#### 专栏动态的模版消息参数

| 参数            | 描述       | 备注                 |
|:--------------|:---------|:-------------------|
| `id`          | 此动态的ID   | 感觉用不到              |
| `name`        | UP名称     |                    |
| `uid`         | UP的UID   |                    |
| `pub_time`    | 动态的发布时间  | 粗略的，比如：昨天          |
| `pub_tss`     | 动态的发布时间  | 详细的时间，根据时间戳转化后的字符串 |
| `like_num`    | 点赞数      |                    |
| `comment_num` | 评论数      |                    |
| `forward_num` | 转发数      |                    |
| `title`       | 专栏的标题    |                    |
| `url`         | 此动态的访问链接 |                    |
| `desc`        | 专栏的描述    |                    |
| `label`       | 专栏的阅读量   | 一个大致的量，如：20.7万阅读   |

#### 投稿视频动态的模版消息参数

| 参数            | 描述       | 备注                 |
|:--------------|:---------|:-------------------|
| `id`          | 此动态的ID   | 感觉用不到              |
| `name`        | UP名称     |                    |
| `uid`         | UP的UID   |                    |
| `pub_time`    | 动态的发布时间  | 粗略的，比如：昨天          |
| `pub_tss`     | 动态的发布时间  | 详细的时间，根据时间戳转化后的字符串 |
| `like_num`    | 点赞数      |                    |
| `comment_num` | 评论数      |                    |
| `forward_num` | 转发数      |                    |
| `url`         | 此动态的访问链接 |                    |
| `img`         | 动态的截图    |                    |
| `archive`     | 投稿视频的信息  | 是一个对象类型            |

`archive` 对象的结构如下：

```ts
{
    aid: string; // 视频的AV号
    badge: {
        bg_color: string;
        color: string;
        text: string // 视频的标签：投稿视频、联合投稿等
    }
    bvid: string; // 视频的BV号
    cover: string; // 视频封面
    desc: string;// 视频的简介
    disable_preview: boolean;
    duration_text: string;// 视频的时长
    jump_url: string;// 跳转链接
    stat: {
        danmaku: string;//弹幕数量
        play: string; // 播放数量
    }
    title: string; // 视频标题
    type: number;
}
```

</details>

### 动态类型

<details>

<summary>展开...</summary>

| 动态类型                          | 描述            |
|-------------------------------|---------------|
| DYNAMIC_TYPE_ARTICLE          | 专栏类型          |
| DYNAMIC_TYPE_AV               | 投稿视频类型        |
| DYNAMIC_TYPE_DRAW             | 文字+图片类型       |
| DYNAMIC_TYPE_FORWARD          | 转发动态          |
| DYNAMIC_TYPE_LIVE_RCMD        | 直播推送动态        |
| DYNAMIC_TYPE_LIVE             | 直播间分享         |
| DYNAMIC_TYPE_WORD             | 纯文字动态         |
| DYNAMIC_TYPE_PGC              | 剧集（番剧、电影、纪录片） |
| DYNAMIC_TYPE_COURSES          |               |
| DYNAMIC_TYPE_MUSIC            | 音乐            |
| DYNAMIC_TYPE_COMMON_SQUARE    | 装扮            |
| DYNAMIC_TYPE_COMMON_VERTICAL  |               |
| DYNAMIC_TYPE_MEDIALIST        | 收藏夹           |
| DYNAMIC_TYPE_COURSES_SEASON   | 课程            |
| DYNAMIC_TYPE_COURSES_BATCH    |               |
| DYNAMIC_TYPE_AD               |               |
| DYNAMIC_TYPE_APPLET           |               |
| DYNAMIC_TYPE_SUBSCRIPTION     |               |
| DYNAMIC_TYPE_BANNER           |               |
| DYNAMIC_TYPE_UGC_SEASON       | 合集更新          |
| DYNAMIC_TYPE_SUBSCRIPTION_NEW |               |
| DYNAMIC_TYPE_NONE             | 无效动态          |

</details>

## 自定义字体

目前支持自定义字体，可通过**覆盖**本插件的 `public/fonts` 目录下的字体文件实现，强烈建议使用 `woff2` 或者 `woff`
格式的压缩字体，可以在[字体转换器](https://fontconverter.com/zh/)站点进行字体的转换。

## 更新日志

[CHANGELOG](https://github.com/BennettChina/hot-news/blob/main/CHANGELOG.md)

## 感谢

- 感谢 [AnyKnew](https://www.anyknew.com/#/) 站长提供的API
- 感谢 [韩小韩的API](https://api.vvhan.com/)、 "妥妥的" 的 API 、以及 "摸鱼人日报" 微信公众号提供摸鱼日报。
- 感谢 [SocialSisterYi](https://github.com/SocialSisterYi)
  的 [哔哩哔哩 - API 收集整理](https://github.com/SocialSisterYi/bilibili-API-collect) 项目

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