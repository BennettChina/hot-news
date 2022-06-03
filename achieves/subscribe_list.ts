import { InputParameter } from "@modules/command";
import { getChatInfo } from "#hot-news/util/tools";
import { MessageType } from "@modules/message";
import { AuthLevel } from "@modules/management/auth";
import { getHashField } from "#hot-news/util/RedisUtils";
import { CHANNEL_NAME, DB_KEY } from "#hot-news/util/constants";
import { getBiliLive } from "#hot-news/util/api";
import { config } from "#hot-news/init";

export async function main( { sendMessage, messageData, auth, redis }: InputParameter ): Promise<void> {
	const { type, targetId, user_id } = getChatInfo( messageData );
	if ( type === MessageType.Group ) {
		const check = await auth.check( user_id, AuthLevel.Manager )
		if ( !check ) {
			await sendMessage( '您的权限不能使用该指令', true );
			return;
		}
	}
	
	// 判断该用户是否有订阅
	let member: string = JSON.stringify( { targetId, type } )
	let existNews: boolean = await redis.existSetMember( DB_KEY.ids, member );
	let existBili: boolean = await redis.existSetMember( DB_KEY.sub_bili_ids_key, member );
	if ( !existNews && !existBili ) {
		await sendMessage( `[${ targetId }]未订阅任何信息` );
		return;
	}
	
	// 获取新闻渠道
	const channel: string = await getHashField( DB_KEY.channel, `${ targetId }` );
	
	// 获取用户订阅的UP的uid
	let upNames: string[] = [];
	const uidListStr: string = await getHashField( DB_KEY.notify_bili_ids_key, `${ targetId }` ) || "[]";
	const uidList: number[] = JSON.parse( uidListStr );
	for ( let uid of uidList ) {
		const info = await getBiliLive( uid, true );
		upNames.push( info.name );
	}
	
	let msg: string = `[${ targetId }]订阅了:\n新闻: ${ existNews ? `[${ CHANNEL_NAME[channel] }]` : "未订阅新闻" }\nB站UP: ${ existBili ? `[${ upNames }]\n您还可以订阅${ config.maxSubscribeNum - upNames.length }位UP主.` : "未订阅B站UP" }`;
	await sendMessage( msg );
}