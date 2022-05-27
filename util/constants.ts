export const DB_KEY = {
	// 订阅新闻的QQ号/QQ群号
	ids: "hot_news.subscribe_ids",
	// 订阅的新闻渠道
	channel: "hot_news.subscribe_channel",
	// 订阅bilibili的QQ号/QQ群号
	sub_bili_ids_key: 'hot_news.sub_bili_ids',
	// bilibili直播推送状态
	bili_live_notified: 'hot_news.bili_live_notified',
	// 已发布的bilibili动态ID集合
	bili_dynamic_ids_key: 'hot_news.bili_dynamic_ids',
	// bilibili动态内容
	bili_dynamic_key: 'hot_news.bili_dynamic',
	// bilibili某UP的直播间信息
	bili_live_info_key: 'hot_news.bili_live_info',
	// 限制bilibili动态过时的时间
	limit_bili_dynamic_time_key: "hot_news.limit_bili_dynamic_time",
	// 图片信息缓存
	img_msg_key: 'hot_news.img_msg',
	// 用户订阅的bilibili up主uid
	notify_bili_ids_key: 'hot_news.notify_bili_ids',
}

export const CHANNEL_NAME = {
	toutiao: '头条',
	sina: '新浪',
	wangyi: '网易',
	zhihu: '知乎',
	baidu: '百度',
	genshin: '原神'
}