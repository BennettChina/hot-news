import { Renderer } from "@/modules/renderer";
import { ScheduleNews } from "#/hot-news/module/ScheduleNews";
import NewsConfig, { INewsConfig } from "#/hot-news/module/NewsConfig";
import { definePlugin } from "@/modules/plugin";
import cfgList from "#/hot-news/commands";
import bot from "ROOT";
import routers from "#/hot-news/routes";
import { DB_KEY } from "#/hot-news/util/constants";
import { MessageType } from "@/modules/message";
import { BOT } from "@/modules/bot";
import { cancelJob } from "node-schedule";
import { ExportConfig } from "@/modules/config";

export let renderer: Renderer;
export let config: ExportConfig<INewsConfig>;
export let scheduleNews: ScheduleNews;

export async function clearSubscribe( targetId: number, messageType: MessageType, { redis, logger }: BOT ) {
	const tips: string = messageType === MessageType.Private ? "私聊" : "群聊";
	// 处理原神B站动态订阅
	const exist: boolean = await redis.existHashKey( DB_KEY.notify_bili_ids_key, `${ targetId }` );
	if ( exist ) {
		await redis.delHash( DB_KEY.notify_bili_ids_key, `${ targetId }` );
		await redis.deleteKey( `${ DB_KEY.limit_bili_dynamic_time_key }.${ targetId }` );
		logger.info( ` [hot-news] 已为 ${ tips }(${ targetId }) 取消订阅BiliBili动态` );
	}
	
	// 处理新闻订阅
	const existNotify: boolean = await redis.existHashKey( DB_KEY.channel, `${ targetId }` );
	if ( existNotify ) {
		await redis.delHash( DB_KEY.channel, `${ targetId }` );
		logger.info( ` [hot-news] 已为 ${ tips }(${ targetId }) 已取消订阅新闻服务` );
	}
	
	await redis.delHash( DB_KEY.subscribe_chat_info_key, `${ targetId }` );
}

async function fixData( { redis }: BOT ) {
	let sets = await redis.getSet( `hot_news.sub_bili_ids` );
	const chat_info = {};
	if ( sets.length > 0 ) {
		for ( const member of sets ) {
			const { targetId, type } = JSON.parse( member );
			chat_info[`${ targetId }`] = `${ type }`;
		}
	}
	
	sets = await redis.getSet( `hot_news.subscribe_ids` );
	if ( sets.length > 0 ) {
		for ( const member of sets ) {
			const { targetId, type } = JSON.parse( member );
			chat_info[`${ targetId }`] = `${ type }`;
		}
	}
	
	if ( Object.keys( chat_info ).length === 0 ) {
		return;
	}
	
	await redis.setHash( DB_KEY.subscribe_chat_info_key, chat_info );
	await redis.deleteKey( `hot_news.subscribe_ids` );
	await redis.deleteKey( `hot_news.sub_bili_ids` );
}


export default definePlugin( {
	name: "新闻订阅",
	cfgList,
	server: {
		routers
	},
	publicDirs: [ "assets", "views", "components" ],
	repo: {
		owner: "BennettChina",
		repoName: "hot-news",
		ref: "v3"
	},
	subscribe: [
		{
			name: "新闻订阅",
			getUser() {
				return ( async () => {
					const all_subs = await bot.redis.getHash( DB_KEY.channel );
					const qq_list: number[] = Object.keys( all_subs ).map( value => parseInt( value ) );
					const chat_info = await bot.redis.getHash( DB_KEY.subscribe_chat_info_key );
					return {
						person: qq_list.filter( value => parseInt( chat_info[value] ) === MessageType.Private ),
						group: qq_list.filter( value => parseInt( chat_info[value] ) === MessageType.Group )
					}
				} )()
			},
			async reSub( userId, type ) {
				const messageType: MessageType = type === "private" ? MessageType.Private : MessageType.Group;
				await clearSubscribe( userId, messageType, bot );
			}
		},
		{
			name: "B站订阅",
			getUser() {
				return ( async () => {
					const all_subs = await bot.redis.getHash( DB_KEY.notify_bili_ids_key );
					const qq_list: number[] = Object.keys( all_subs ).map( value => parseInt( value ) );
					const chat_info = await bot.redis.getHash( DB_KEY.subscribe_chat_info_key );
					return {
						person: qq_list.filter( value => parseInt( chat_info[value] ) === MessageType.Private ),
						group: qq_list.filter( value => parseInt( chat_info[value] ) === MessageType.Group )
					}
				} )()
			},
			async reSub( userId, type ) {
				const messageType: MessageType = type === "private" ? MessageType.Private : MessageType.Group;
				await clearSubscribe( userId, messageType, bot );
			}
		},
		{
			name: "短信订阅",
			getUser() {
				return ( async () => {
					const sms_sub = await bot.redis.getHash( DB_KEY.sms_key );
					const qq_list: number[] = Object.keys( sms_sub ).map( value => parseInt( value ) );
					return {
						person: qq_list
					}
				} )()
			},
			async reSub( userId, type ) {
				if ( type === "group" ) return;
				await bot.redis.delHash( DB_KEY.sms_key, `${ userId }` );
				await bot.redis.delHash( DB_KEY.sms_secret, `${ userId }` );
			}
		}
	],
	async mounted( params ) {
		config = params.configRegister( "hot-news", NewsConfig.init );
		// 处理旧数据
		await fixData( params );
		scheduleNews = new ScheduleNews( bot, config );
		params.refreshRegister( scheduleNews );
		params.setAlias( config.aliases );
		config.on( "refresh", newCfg => {
			params.setAlias( newCfg.aliases );
		} );
		
		/* 实例化渲染器 */
		renderer = params.renderRegister( "#app", "views" );
	},
	async unmounted() {
		// 卸载插件时把定时任务清掉
		cancelJob( "hot-news" );
		cancelJob( "hot-news-bilibili-dynamic-job" );
		cancelJob( "hot-news-bilibili-live-job" );
		cancelJob( "hot-news-moyu-job" );
	}
} );