import { InputParameter } from "@modules/command";
import { clearSubscribe } from "#hot-news/init";
import { MessageType } from "@modules/message";

export async function main( bot: InputParameter ): Promise<void> {
	const { sendMessage, messageData } = bot;
	const group_id = messageData.raw_message;
	await clearSubscribe( parseInt( group_id ), MessageType.Group, bot );
	await sendMessage( `已取消群 [${ group_id }] 的新闻订阅和B站订阅` );
}