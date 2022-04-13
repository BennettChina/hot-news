import { InputParameter } from "@modules/command";
import { DB_KEY } from "#hot-news/achieves/subscribe_news";
import { getChatInfo } from "#hot-news/util/tools";

export async function main( { sendMessage, messageData, redis }: InputParameter ): Promise<void> {
	const { type, targetId } = getChatInfo( messageData );
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