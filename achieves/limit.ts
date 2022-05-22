import { InputParameter } from "@modules/command";
import { getChatInfo } from "#hot-news/util/tools";
import { MessageType } from "@modules/message";
import { AuthLevel } from "@modules/management/auth";
import { DB_KEY } from "#hot-news/util/constants";

export async function main( { sendMessage, messageData, auth, redis, client }: InputParameter ): Promise<void> {
	const { type, targetId, user_id } = getChatInfo( messageData );
	if ( type === MessageType.Group ) {
		const check = await auth.check( user_id, AuthLevel.Manager )
		if ( !check ) {
			await sendMessage( '您的权限不能使用该指令', true );
			return;
		}
	}
	
	const number = parseInt( messageData.raw_message );
	await redis.setString( `${ DB_KEY.limit_genshin_dynamic_time_key }.${ targetId }`, number );
	await sendMessage( `已将${ number }小时设置为原神动态消息过时时间，超过该时间的消息将不再推送` );
}