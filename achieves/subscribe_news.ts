import { InputParameter } from "@modules/command";
import { MessageType } from "@modules/message";
import { getNews } from "#hot-news/util/api";
import { getChatInfo } from "#hot-news/util/tools";
import { CHANNEL_NAME, DB_KEY } from "#hot-news/util/constants";
import { getHashField } from "#hot-news/util/RedisUtils";
import { config, scheduleNews } from "#hot-news/init";
import { GroupMessageEventData, Sendable } from "oicq";
import Database from "@modules/database";

export const getChannelKey: ( channel: string ) => ( string | null ) = ( channel ) => {
	if ( /\d/.test( channel ) ) {
		return channel
	}
	
	for ( let k in CHANNEL_NAME ) {
		if ( CHANNEL_NAME[k] === channel ) {
			return k;
		}
	}
	
	return null;
}


async function biliHandler( targetId: number, sendMessage: ( content: Sendable, allowAt?: boolean ) => Promise<void>, redis: Database, db_data: string, uid: number ) {
	// 获取用户订阅的UP的uid
	const uidListStr: string = await getHashField( DB_KEY.notify_bili_ids_key, `${ targetId }` ) || "[]";
	const uidList: number[] = JSON.parse( uidListStr );
	const name = uid === 401742377 ? "原神" : `${ uid }`;
	if ( uidList.includes( uid ) ) {
		await sendMessage( `[${ targetId }]已订阅过B站[${ name }]的动态和直播。` );
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
	await sendMessage( `[${ targetId }]已成功订阅B站[${ name }]的动态和直播。` );
	return;
}

export async function main( { sendMessage, messageData, redis }: InputParameter ): Promise<void> {
	const channel = messageData.raw_message || '头条';
	const { type, targetId } = getChatInfo( messageData );
	if ( type === MessageType.Unknown ) {
		await sendMessage( '不支持的聊天来源,请在需要订阅的群里或者好友对话中使用!' );
		return;
	}
	
	let channelKey = getChannelKey( channel )
	if ( !channelKey ) {
		const useChannel: string[] = [];
		for ( let k in CHANNEL_NAME ) {
			useChannel.push( CHANNEL_NAME[k] )
		}
		await sendMessage( `信息源[${ channel }]不是可用的选择,可选择${ useChannel.toString() }\n或者使用B站UP主的uid来订阅TA的动态和直播` );
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
	const isNumber = /\d/.test( channel );
	if ( channel === CHANNEL_NAME.genshin || ( isNumber && parseInt( channel ) === 401742377 ) ) {
		await biliHandler( targetId, sendMessage, redis, db_data, 401742377 );
		return;
	}
	
	// 处理B站UP主订阅
	if ( isNumber ) {
		// 初始化该UP的动态数据
		const uid = parseInt( channel );
		await biliHandler( targetId, sendMessage, redis, db_data, uid );
		return;
	}
	
	// 处理新闻订阅
	await redis.setHash( DB_KEY.channel, { [`${ targetId }`]: channelKey } );
	redis.addSetMember( DB_KEY.ids, db_data ).then( () => {
		sendMessage( `[${ targetId }]已成功订阅[${ channel }]新闻。` );
		getNews( channelKey! ).then( news => {
			sendMessage( news );
		} );
	} );
	
}