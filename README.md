本项目为 https://github.com/SilveryStar/Adachi-BOT 衍生插件，用于订阅热点新闻。

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

```shell
git clone https://gitclone.com/github.com/BennettChina/hot-news.git
```

> 感谢[GitClone](https://gitclone.com/) 和 [GitHub Proxy](https://ghproxy.com/) 提供的镜像服务！

## 使用方法

在需要订阅新闻的群里或者好友聊天对话中使用

```
# 订阅新闻(使用默认的头条新闻)
命令: <header> subscribe_news
范围: 群/私聊
权限: BOT管理员 (Manager)

# 订阅新闻(选择新闻来源),可选：[新浪｜百度｜头条｜网易｜知乎]
命令: <header> subscribe_news 新浪
范围: 群/私聊
权限: BOT管理员 (Manager)

#取消订阅
命令: <header> unsubscribe_news
范围: 群/私聊
权限: BOT管理 (Manager)
```
