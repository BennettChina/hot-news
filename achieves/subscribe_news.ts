import { InputParameter } from "@modules/command";
import { MessageType } from "@modules/message";
import { getBiliLive } from "#hot-news/util/api";
import { getChannelKey, getChatInfo } from "#hot-news/util/tools";
import { CHANNEL_NAME, DB_KEY } from "#hot-news/util/constants";
import { getHashField } from "#hot-news/util/RedisUtils";
import { config, scheduleNews } from "#hot-news/init";
import { GroupMessageEventData, Sendable } from "oicq";
import Database from "@modules/database";
import { NewsServiceFactory } from "#hot-news/module/NewsServiceFactory";


async function biliHandler( targetId: number, sendMessage: ( content: Sendable, allowAt?: boolean ) => Promise<void>, redis: Database, db_data: string, uid: number, upName: string ): Promise<void> {
	// 获取用户订阅的UP的uid
	const uidListStr: string = await getHashField( DB_KEY.notify_bili_ids_key, `${ targetId }` ) || "[]";
	const uidList: number[] = JSON.parse( uidListStr );
	if ( uidList.includes( uid ) ) {
		await sendMessage( `[${ targetId }]已订阅过B站[${ upName }]的动态和直播。` );
		return;
	}
	
	if ( uidList.length >= config.maxSubscribeNum ) {
		await sendMessage( `[${ targetId }]的可订阅UP主数量已达到 BOT 持有者设置的上限，无法再订阅UP主，可通过取消其他UP主的订阅减少你的订阅数量。` )
		return;
	}
	
	uidList.push( uid );
	await redis.setHash( DB_KEY.notify_bili_ids_key, { [`${ targetId }`]: JSON.stringify( uidList ) } );
	await redis.addSetMember( DB_KEY.sub_bili_ids_key, db_data );
	await scheduleNews.initBiliDynamic( uid );
	await sendMessage( `[${ targetId }]已成功订阅B站[${ upName }]的动态和直播。` );
	return;
}

export async function main( { sendMessage, messageData, redis, logger }: InputParameter ): Promise<void> {
	const channel = messageData.raw_message || CHANNEL_NAME.toutiao;
	const { type, targetId } = getChatInfo( messageData );
	if ( type === MessageType.Unknown ) {
		await sendMessage( '不支持的聊天来源,请在需要订阅的群里或者好友对话中使用!' );
		return;
	}
	
	if ( channel === CHANNEL_NAME.moyu && !config.subscribeMoyu.enable ) {
		await sendMessage( "BOT 持有者未启用摸鱼日报服务，该服务无法使用。" );
		return;
	}
	
	let channelKey = getChannelKey( channel );
	if ( !channelKey ) {
		let useChannel: string[] = [];
		for ( let k in CHANNEL_NAME ) {
			useChannel.push( CHANNEL_NAME[k] )
		}
		if ( !config.subscribeMoyu.enable ) {
			useChannel = useChannel.filter( value => value !== CHANNEL_NAME.moyu );
		}
		await sendMessage( `信息源[${ channel }]不是可用的选择,可选择[${ useChannel.toString() }]\n或者使用B站UP主的uid来订阅TA的动态和直播` );
		return;
	}
	
	const db_data = JSON.stringify( { targetId, type } );
	
	if ( type === MessageType.Group ) {
		const groupMsg = <GroupMessageEventData>messageData;
		if ( groupMsg.sender.role === 'member' ) {
			await sendMessage( '您不是本群管理不能使用该指令', true );
			return;
		}
	}
	
	// 处理原神B站动态订阅
	if ( channelKey === CHANNEL_NAME.genshin || ( channelKey === 401742377 ) ) {
		await biliHandler( targetId, sendMessage, redis, db_data, 401742377, '原神' );
		return;
	}
	
	if ( typeof channelKey === "number" ) {
		// 处理B站UP主订阅
		let upName = "";
		try {
			const info = await getBiliLive( channelKey, true );
			if ( !info ) {
				await sendMessage( `[${ channel }]不是一个可用的 uid`, true );
			}
			upName = info.name;
		} catch ( e ) {
			logger.warn( `获取B站[${ channelKey }]个人信息失败!`, e );
			await sendMessage( `查询B站[${ channel }]时网络请求错误, 请联系 BOT 持有者反馈该问题!`, true );
		}
		// 初始化该UP的动态数据
		await biliHandler( targetId, sendMessage, redis, db_data, channelKey, upName );
		return;
	} else {
		// 处理新闻、摸鱼等订阅
		let value: string = await redis.getHashField( DB_KEY.channel, `${ targetId }` );
		value = value.startsWith( "[" ) ? value : `["${ value }"]`;
		logger.info( `[hot-news]-value:${ value }` );
		let parse: string[] = JSON.parse( value );
		if ( !parse.includes( channelKey ) ) {
			parse.push( channelKey );
			await redis.setHash( DB_KEY.channel, { [`${ targetId }`]: JSON.stringify( parse ) } );
		}
		await redis.addSetMember( DB_KEY.ids, db_data );
		await sendMessage( `[${ targetId }]已成功订阅[${ channel }]消息。` );
		
		const news = await NewsServiceFactory.instance( channel ).getInfo( channelKey );
		await sendMessage( news );
	}
}