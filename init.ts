import { PluginSetting, PluginSubSetting, SubInfo } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { MessageScope, MessageType } from "@modules/message";
import { AuthLevel } from "@modules/management/auth";
import { DB_KEY } from "#hot-news/util/constants";
import { Renderer } from "@modules/renderer";
import { BOT } from "@modules/bot";
import { ScheduleNews } from "#hot-news/module/ScheduleNews";
import NewsConfig from "#hot-news/module/NewsConfig";
import FileManagement from "@modules/file";
import { ChatInfo } from "#hot-news/types/type";
import { MemberDecreaseEventData } from "oicq";

const subscribe_news: OrderConfig = {
	type: "order",
	cmdKey: "hot-news.subscribe_news",
	desc: [ "订阅新闻", "(订阅源)" ],
	headers: [ "subscribe_news" ],
	regexps: [ ".*" ],
	scope: MessageScope.Both,
	auth: AuthLevel.User,
	main: "achieves/subscribe_news",
	detail: "订阅每日热点新闻、B站动态、摸鱼日报，可用的订阅源包括：\n" +
		"- 新闻源：新浪、知乎、网易、头条、百度。默认使用头条，仅可使用一个新闻源覆盖订阅(每天8:30~9点推送)。\n" +
		"- B站源：原神，也可以使用B站UP的uid来订阅该UP的动态和直播。\n" +
		"- 摸鱼日报源：摸鱼。"
};

const unsubscribe_news: OrderConfig = {
	type: "order",
	cmdKey: "hot-news.unsubscribe_news",
	desc: [ "取消订阅新闻", "[订阅源]" ],
	headers: [ "unsubscribe_news" ],
	regexps: [ ".+" ],
	scope: MessageScope.Both,
	auth: AuthLevel.User,
	main: "achieves/unsubscribe_news",
	detail: "取消订阅的消息。可用订阅源：\n" +
		"- 新闻源: 新浪、知乎、网易、头条、百度\n" +
		"- B站源: 原神、B站UP主的uid\n" +
		"- 摸鱼日报: 摸鱼"
};

const limit_genshin_dynamic_notify: OrderConfig = {
	type: "order",
	cmdKey: "hot-news.limit_genshin_dynamic_notify",
	desc: [ "设置动态推送保留时间", "[小时]" ],
	headers: [ "lgdn" ],
	regexps: [ "\\d+" ],
	scope: MessageScope.Both,
	auth: AuthLevel.User,
	main: "achieves/limit",
	detail: "设置推送动态信息的保留时间，如果这条动态已经过去了某某小时则视为用户已自行得知该消息，放弃推送该消息"
};

const my_subscribe_list: OrderConfig = {
	type: "order",
	cmdKey: "hot-news.my_subscribe_list",
	desc: [ "我的新闻订阅列表", "" ],
	headers: [ "mysl" ],
	regexps: [ "" ],
	scope: MessageScope.Both,
	auth: AuthLevel.User,
	main: "achieves/subscribe_list",
	detail: "查看我订阅的新闻和UP主"
};

const remove_subscribe: OrderConfig = {
	type: "order",
	cmdKey: "hot-news.remove_subscribe",
	desc: [ "移除某群订阅的消息", "[群号]" ],
	headers: [ "rms" ],
	regexps: [ "\\d+" ],
	scope: MessageScope.Private,
	auth: AuthLevel.Manager,
	main: "achieves/remove_subscribe",
	detail: "该指令用户移除某个群的所有新闻和B站订阅"
};

export let renderer: Renderer;
export let config: NewsConfig;
export let scheduleNews: ScheduleNews;

export async function clearSubscribe( targetId: number, messageType: MessageType, { redis, logger }: BOT ) {
	let member: string = JSON.stringify( { targetId, type: messageType } )
	// 处理原神B站动态订阅
	const exist: boolean = await redis.existSetMember( DB_KEY.sub_bili_ids_key, member )
	if ( exist ) {
		await redis.delSetMember( DB_KEY.sub_bili_ids_key, member );
		await redis.delHash( DB_KEY.notify_bili_ids_key, `${ targetId }` );
		await redis.deleteKey( `${ DB_KEY.limit_bili_dynamic_time_key }.${ targetId }` );
		await logger.info( `--[hot-news]--已为[${ targetId }]取消订阅BiliBili动态` );
	}
	
	// 处理新闻订阅
	const existNotify: boolean = await redis.existSetMember( DB_KEY.ids, member );
	if ( existNotify ) {
		await redis.delSetMember( DB_KEY.ids, member );
		await redis.delHash( DB_KEY.channel, `${ targetId }` );
		await logger.info( `--[hot-news]--已为[${ targetId }]已取消订阅新闻服务` );
	}
}

/* 若开启必须添加好友，则删除好友后清除订阅服务 */
async function decreaseFriend( userId: number, bot: BOT ): Promise<void> {
	if ( bot.config.addFriend ) {
		await clearSubscribe( userId, MessageType.Private, bot );
	}
}

/**
 * 由于redis的key发生变化，用此函数清除过期的数据，并将已有的数据放到新的key中
 */
const clearDeprecatedData = async ( { redis }: BOT ) => {
	const subs: string[] = await redis.getSet( "hot_news.sub_genshin_ids" );
	if ( subs.length > 0 ) {
		await redis.addSetMember( DB_KEY.sub_bili_ids_key, ...subs );
		let obj: any = Object.create( null );
		for ( let sub of subs ) {
			// 把原有的订阅数据初始化进去
			const chatInfo: ChatInfo = JSON.parse( sub );
			obj[`${ chatInfo.targetId }`] = JSON.stringify( [ 401742377 ] );
		}
		await redis.setHash( DB_KEY.notify_bili_ids_key, obj );
	}
	await redis.deleteKey( "hot_news.sub_genshin_ids" );
	await redis.deleteKey( "hot_news.genshin_dynamic_ids" );
	const keys = await redis.getKeysByPrefix( "hot_news.limit_genshin_dynamic_time." );
	for ( let key of keys ) {
		const limit = await redis.getString( key );
		let strings = key.split( "." );
		const targetId = strings[strings.length - 1];
		await redis.setString( `${ DB_KEY.limit_bili_dynamic_time_key }.${ targetId }`, limit )
		await redis.deleteKey( key );
	}
}

function loadConfig( file: FileManagement ): NewsConfig {
	const initCfg = NewsConfig.init;
	const fileName: string = "hot_news";
	
	const path: string = file.getFilePath( `${ fileName }.yml` );
	const isExist: boolean = file.isExist( path );
	if ( !isExist ) {
		file.createYAML( fileName, initCfg );
		return new NewsConfig( initCfg );
	}
	
	const config: any = file.loadYAML( fileName );
	const keysNum = o => Object.keys( o ).length;
	
	/* 检查 defaultConfig 是否更新 */
	if ( keysNum( config ) !== keysNum( initCfg ) ) {
		const c: any = {};
		const keys: string[] = Object.keys( initCfg );
		for ( let k of keys ) {
			c[k] = config[k] ? config[k] : initCfg[k];
		}
		file.writeYAML( fileName, c );
		return new NewsConfig( c );
	}
	return new NewsConfig( config );
}

export async function newsSubs( { redis }: BOT ): Promise<SubInfo[]> {
	const subNewsIds: string[] = await redis.getSet( DB_KEY.ids );
	const newsSubUsers: number[] = subNewsIds.map( value => {
		const { type, targetId }: ChatInfo = JSON.parse( value );
		if ( type === MessageType.Private ) {
			return targetId;
		}
		return -1;
	} ).filter( value => value !== -1 );
	
	const subBiliIds: string[] = await redis.getSet( DB_KEY.sub_bili_ids_key );
	const biliSubUsers: number[] = subBiliIds.map( value => {
		const { type, targetId }: ChatInfo = JSON.parse( value );
		if ( type === MessageType.Private ) {
			return targetId;
		}
		return -1;
	} ).filter( value => value !== -1 );
	
	return [ {
		name: "新闻订阅",
		users: newsSubUsers
	}, {
		name: "B站订阅",
		users: biliSubUsers
	} ]
}

export async function subInfo(): Promise<PluginSubSetting> {
	return {
		subs: newsSubs,
		reSub: decreaseFriend
	}
}

function decreaseGroup( bot: BOT ) {
	return async function ( memberData: MemberDecreaseEventData ) {
		// 如果退出群聊的是 BOT 那么就把该群聊的新闻订阅全部取消
		if ( memberData.user_id === bot.config.number ) {
			await clearSubscribe( memberData.user_id, MessageType.Group, bot );
		}
	}
}

// 不可 default 导出，函数名固定
export async function init( bot: BOT ): Promise<PluginSetting> {
	/* 加载 hot_news.yml 配置 */
	config = loadConfig( bot.file );
	
	/* 清除旧数据 */
	await clearDeprecatedData( bot );
	
	scheduleNews = new ScheduleNews( bot, config );
	/* 创建每日新闻定时任务 */
	scheduleNews.createNewsSchedule();
	
	/* 初始化B站所有已订阅的UP主的动态数据 */
	await scheduleNews.initAllBiliDynamic();
	
	/* 实例化渲染器 */
	renderer = bot.renderer.register( "hot-news", "/", 0, "" );
	
	/* 初始化杂项定时任务 */
	scheduleNews.initSchedule();
	
	// 监听群聊退出事件
	bot.client.on( "notice.group.decrease", decreaseGroup( bot ) );
	bot.logger.info( "[hot-news]群聊退出事件监听已启动成功" )
	
	bot.refresh.registerRefreshableFile( "hot_news", config );
	bot.refresh.registerRefreshableFunc( scheduleNews );
	
	return {
		pluginName: "hot-news",
		cfgList: [ subscribe_news, unsubscribe_news, limit_genshin_dynamic_notify, my_subscribe_list, remove_subscribe ]
	};
}