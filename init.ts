import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { MessageScope, MessageType } from "@modules/message";
import { AuthLevel } from "@modules/management/auth";
import bot from "ROOT";
import { DB_KEY } from "#hot-news/util/constants";
import * as sdk from "oicq";
import { config } from "#genshin/init";
import { Renderer } from "@modules/renderer";
import { BOT } from "@modules/bot";
import { ScheduleNews } from "#hot-news/module/ScheduleNews";

const subscribe_news: OrderConfig = {
	type: "order",
	cmdKey: "hot-news.subscribe_news",
	desc: [ "订阅新闻", "(订阅源)" ],
	headers: [ "subscribe_news" ],
	regexps: [ ".*" ],
	scope: MessageScope.Both,
	auth: AuthLevel.User,
	main: "achieves/subscribe_news",
	detail: "订阅每日热点新闻和B站原神动态，可用的新闻订阅源包括：新浪、知乎、网易、头条、百度，默认使用头条，仅可使用一个新闻源覆盖订阅(每天8:30~9点推送)。可用原神订阅源：原神"
};

const unsubscribe_news: OrderConfig = {
	type: "order",
	cmdKey: "hot-news.unsubscribe_news",
	desc: [ "取消订阅新闻", "(订阅源)" ],
	headers: [ "unsubscribe_news" ],
	regexps: [ ".*" ],
	scope: MessageScope.Both,
	auth: AuthLevel.User,
	main: "achieves/unsubscribe_news",
	detail: "取消订阅的新闻。可用订阅源：新闻源(新浪、知乎、网易、头条、百度)、原神，默认取消新闻订阅"
};

const limit_genshin_dynamic_notify: OrderConfig = {
	type: "order",
	cmdKey: "hot-news.limit_genshin_dynamic_notify",
	desc: [ "限制原神动态推送", "[小时]" ],
	headers: [ "lgdn" ],
	regexps: [ "\\d+" ],
	scope: MessageScope.Both,
	auth: AuthLevel.User,
	main: "achieves/limit",
	detail: "限制推送原神的动态信息，如果这条动态已经过去了某某小时则视为用户已自行得知该消息，放弃推送该消息"
};

export let renderer: Renderer;

/* 若开启必须添加好友，则删除好友后清除订阅服务 */
function decreaseFriend( { redis, config, logger }: BOT ) {
	return async function ( friendDate: sdk.FriendDecreaseEventData ) {
		if ( config.addFriend ) {
			const targetId = friendDate.user_id;
			let member: string = JSON.stringify( { targetId, type: MessageType.Private } )
			// 处理原神B站动态订阅
			const exist: boolean = await redis.existSetMember( DB_KEY.genshin_ids, member )
			if ( exist ) {
				await redis.delSetMember( DB_KEY.genshin_ids, member );
				await logger.info( `--[hot-news]--已为[${ targetId }]已取消订阅原神动态` );
			}
			
			// 处理新闻订阅
			const existNotify: boolean = await redis.existSetMember( DB_KEY.ids, member );
			if ( existNotify ) {
				await redis.delSetMember( DB_KEY.ids, member );
				await redis.delHash( DB_KEY.channel, `${ targetId }` );
				await logger.info( `--[hot-news]--已为[${ targetId }]已取消订阅新闻服务` );
			}
		}
	}
}

// 不可 default 导出，函数名固定
export async function init(): Promise<PluginSetting> {
	const scheduleNews = new ScheduleNews( bot );
	/* 创建每日新闻定时任务 */
	scheduleNews.createNewsSchedule();
	
	/* 初始化B站原神动态数据 */
	await scheduleNews.initGenshinDynamic();
	
	/* 实例化渲染器 */
	renderer = bot.renderer.register( "hot-news", "/", config.serverPort, "" );
	
	/* 创建原神动态定时任务 */
	scheduleNews.createGenshinSchedule();
	
	// 监听好友删除事件
	bot.client.on( "notice.friend.decrease", decreaseFriend( bot ) );
	bot.logger.info( "[hot-news]好友删除事件监听已启动成功" )
	
	return {
		pluginName: "hot-news",
		cfgList: [ subscribe_news, unsubscribe_news, limit_genshin_dynamic_notify ]
	};
}