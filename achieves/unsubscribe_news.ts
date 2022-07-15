import { InputParameter } from "@modules/command";
import { CHANNEL_NAME, DB_KEY } from "#hot-news/util/constants";
import { getChannelKey, getChatInfo } from "#hot-news/util/tools";
import { MessageType } from "@modules/message";
import { getHashField } from "#hot-news/util/RedisUtils";
import Database from "@modules/database";
import { GroupMessageEventData, Sendable } from "oicq";

export async function main( { sendMessage, messageData, redis }: InputParameter ): Promise<void> {
	const channel = messageData.raw_message;
	const { type, targetId } = getChatInfo( messageData );
	if ( type === MessageType.Group ) {
		const groupMsg = <GroupMessageEventData>messageData;
		if ( groupMsg.sender.role === 'member' ) {
			await sendMessage( '您不是本群管理不能使用该指令', true );
			return;
		}
	}
	
	let member = JSON.stringify( { targetId, type } )
	// 处理原神B站动态订阅
	let channelKey = getChannelKey( channel );
	if ( !channelKey ) {
		await sendMessage( `[${ channel }]不是可用的信息源。` );
		return;
	}
	if ( channel === CHANNEL_NAME.genshin || ( channelKey === 401742377 ) ) {
		await unsubscribeBili( targetId, member, 401742377, redis, sendMessage );
		return;
	}
	
	// 处理B站UP主订阅
	if ( typeof channelKey === "number" ) {
		await unsubscribeBili( targetId, member, channelKey, redis, sendMessage );
		return;
	}
	
	// 处理新闻等订阅
	let exist: boolean = await redis.existSetMember( DB_KEY.ids, member )
	if ( !exist ) {
		await sendMessage( `[${ targetId }]未订阅[${ channel }]` );
	} else {
		let value: string = await redis.getHashField( DB_KEY.channel, `${ targetId }` ) || "[]";
		value = value.startsWith( "[" ) ? value : `["${ value }"]`;
		let parse: string[] = JSON.parse( value );
		if ( !parse.includes( channelKey ) ) {
			await sendMessage( `[${ targetId }]未订阅[${ channel }]` );
			return;
		}
		const filter = parse.filter( v => v && v !== channelKey && v !== CHANNEL_NAME.genshin );
		if ( filter.length === 0 ) {
			await redis.delSetMember( DB_KEY.ids, member );
			await redis.delHash( DB_KEY.channel, `${ targetId }` );
		} else {
			await redis.setHash( DB_KEY.channel, { [`${ targetId }`]: JSON.stringify( filter ) } );
		}
		await sendMessage( `[${ targetId }]已取消订阅[${ channel }]服务` );
	}
}

async function unsubscribeBili( targetId: number, member: string, uid: number, redis: Database, sendMessage: ( content: Sendable, allowAt?: boolean ) => Promise<void> ) {
	let exist: boolean = await redis.existSetMember( DB_KEY.sub_bili_ids_key, member )
	if ( !exist ) {
		await sendMessage( `[${ targetId }]未订阅任何B站UP的动态和直播` );
	} else {
		const uidListStr = await getHashField( DB_KEY.notify_bili_ids_key, `${ targetId }` ) || "[]";
		const uidList: number[] = JSON.parse( uidListStr );
		const name = uid === 401742377 ? "原神" : `${ uid }`;
		if ( uidList.includes( uid ) ) {
			if ( uidList.length === 1 ) {
				await redis.delHash( DB_KEY.notify_bili_ids_key, `${ targetId }` );
				await redis.delSetMember( DB_KEY.sub_bili_ids_key, member );
			} else {
				const filter = uidList.filter( i => i !== uid );
				await redis.setHash( DB_KEY.notify_bili_ids_key, { [`${ targetId }`]: JSON.stringify( filter ) } );
			}
			await sendMessage( `[${ targetId }]已成功取消订阅过B站[${ name }]的动态和直播。` );
			return;
		}
		
		await sendMessage( `[${ targetId }]未订阅过B站[${ name }]的动态和直播。` );
	}
}