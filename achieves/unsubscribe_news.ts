import { InputParameter } from "@modules/command";
import { DB_KEY } from "#hot-news/achieves/subscribe_news";
import { getChatInfo } from "#hot-news/util/tools";
import { MessageType } from "@modules/message";
import { AuthLevel } from "@modules/management/auth";

export async function main( { sendMessage, messageData, redis, auth }: InputParameter ): Promise<void> {
	const { type, targetId, user_id } = getChatInfo( messageData );
	if ( type === MessageType.Group ) {
		const check = await auth.check( user_id, AuthLevel.Manager )
		if ( !check ) {
			await sendMessage( '您的权限不能使用该指令', true );
			return;
		}
	}
	
	let member = JSON.stringify( { targetId, type } )
	let exist: boolean = await redis.existSetMember( DB_KEY.ids, member )
	if ( !exist ) {
		await sendMessage( `[${ targetId }]未订阅新闻` );
	} else {
		await redis.delSetMember( DB_KEY.ids, member );
		await redis.delHash( DB_KEY.channel, `${ targetId }` );
		await sendMessage( `[${ targetId }]已取消订阅新闻服务` );
	}
}