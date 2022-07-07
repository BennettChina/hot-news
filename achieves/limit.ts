import { InputParameter } from "@modules/command";
import { getChatInfo } from "#hot-news/util/tools";
import { MessageType } from "@modules/message";
import { DB_KEY } from "#hot-news/util/constants";
import { GroupMessageEventData } from "oicq";

export async function main( { sendMessage, messageData, redis }: InputParameter ): Promise<void> {
	const { type, targetId } = getChatInfo( messageData );
	if ( type === MessageType.Group ) {
		const groupMsg = <GroupMessageEventData>messageData;
		if ( groupMsg.sender.role === 'member' ) {
			await sendMessage( '您不是本群管理不能使用该指令', true );
			return;
		}
	}
	
	const number = parseInt( messageData.raw_message );
	await redis.setString( `${ DB_KEY.limit_bili_dynamic_time_key }.${ targetId }`, number );
	await sendMessage( `已将${ number }小时设置为原神动态消息过时时间，超过该时间的消息将不再推送` );
}