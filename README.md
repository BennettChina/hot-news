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
```

## 更新日志

- 2022/05/13 增加B站原神动态订阅
- 2022/04/14 新闻推送时间优化为8:30~9点。
- 2022/04/14 修复初始权限太高导致私聊订阅常规用户无法订阅的问题，改为群里使用管理员权限，私聊使用常规用户权限。

## 感谢

- 感谢 [AnyKnew](https://www.anyknew.com/#/) 站长提供的API