import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { MessageScope, MessageType } from "@modules/message";
import { AuthLevel } from "@modules/management/auth";
import bot from "ROOT";
import { DB_KEY } from "#hot-news/achieves/subscribe_news";
import { scheduleJob } from "node-schedule";
import { getNews } from "#hot-news/util/api";
import { getHashField } from "#hot-news/util/RedisUtils";

const subscribe_news: OrderConfig = {
	type: "order",
	cmdKey: "hot-news.subscribe_news",
	desc: [ "订阅新闻", "(订阅源)" ],
	headers: [ "subscribe_news" ],
	regexps: [ ".*" ],
	scope: MessageScope.Both,
	auth: AuthLevel.Manager,
	main: "achieves/subscribe_news",
	detail: "订阅每日热点新闻，可用的订阅源包括：新浪、知乎、网易、头条、百度，默认使用头条，仅可使用一个源覆盖订阅(每天9点推送)。"
};

const unsubscribe_news: OrderConfig = {
	type: "order",
	cmdKey: "hot-news.unsubscribe_news",
	desc: [ "取消订阅新闻", "" ],
	headers: [ "unsubscribe_news" ],
	regexps: [ "" ],
	scope: MessageScope.Both,
	auth: AuthLevel.Manager,
	main: "achieves/unsubscribe_news",
	detail: "取消订阅的新闻"
};

// 不可 default 导出，函数名固定
export async function init(): Promise<PluginSetting> {
	scheduleJob( "0 0 9 * * *", async () => {
		bot.redis.getSet( DB_KEY.ids ).then( subs => {
			subs.forEach( sub => {
				const {
					targetId,
					type
				}: { targetId: number, type: number } = JSON.parse( sub );
				
				getHashField( DB_KEY.channel, `${ targetId }` ).then( channel => {
					getNews( channel ).then( news => {
						if ( type === MessageType.Private ) {
							bot.client.sendPrivateMsg( targetId, news )
						} else {
							bot.client.sendGroupMsg( targetId, news );
						}
					} ).catch( reason => {
						bot.logger.error( reason )
					} )
				} );
			} )
		} )
	} );
	
	return {
		pluginName: "hot-news",
		cfgList: [ subscribe_news, unsubscribe_news ]
	};
}