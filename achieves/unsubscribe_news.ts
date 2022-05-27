import { InputParameter } from "@modules/command";
import { CHANNEL_NAME, DB_KEY } from "#hot-news/util/constants";
import { getChatInfo } from "#hot-news/util/tools";
import { MessageType } from "@modules/message";
import { AuthLevel } from "@modules/management/auth";
import { getHashField } from "#hot-news/util/RedisUtils";
import Database from "@modules/database";
import { Sendable } from "oicq";

export async function main( { sendMessage, messageData, redis, auth }: InputParameter ): Promise<void> {
	const channel = messageData.raw_message || '新闻';
	const { type, targetId, user_id } = getChatInfo( messageData );
	if ( type === MessageType.Group ) {
		const check = await auth.check( user_id, AuthLevel.Manager )
		if ( !check ) {
			await sendMessage( '您的权限不能使用该指令', true );
			return;
		}
	}
	
	let member = JSON.stringify( { targetId, type } )
	// 处理原神B站动态订阅
	const isNumber = /\d/.test( channel );
	if ( channel === CHANNEL_NAME.genshin || ( isNumber && parseInt( channel ) === 401742377 ) ) {
		await unsubscribeBili( targetId, member, 401742377, redis, sendMessage );
		return;
	}
	
	// 处理B站UP主订阅
	if ( isNumber ) {
		// 初始化该UP的动态数据
		const uid = parseInt( channel );
		await unsubscribeBili( targetId, member, uid, redis, sendMessage );
		return;
	}
	
	// 处理新闻订阅
	let exist: boolean = await redis.existSetMember( DB_KEY.ids, member )
	if ( !exist ) {
		await sendMessage( `[${ targetId }]未订阅新闻` );
	} else {
		await redis.delSetMember( DB_KEY.ids, member );
		await redis.delHash( DB_KEY.channel, `${ targetId }` );
		await sendMessage( `[${ targetId }]已取消订阅新闻服务` );
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
			await redis.delHash( DB_KEY.notify_bili_ids_key, `${ targetId }` );
			await sendMessage( `[${ targetId }]已成功取消订阅过B站[${ name }]的动态和直播。` );
			return;
		}
		
		await sendMessage( `[${ targetId }]未订阅过B站[${ name }]的动态和直播。` );
	}
}