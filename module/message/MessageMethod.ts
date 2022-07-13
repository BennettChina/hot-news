import bot from "ROOT";
import { MessageType } from "@modules/message";
import { Order } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";
import { Sendable } from "oicq";

export class MessageMethod {
	static async sendMsg( type: number, targetId: number, msg: Sendable ) {
		if ( type === MessageType.Private ) {
			const sendMessage = bot.message.getSendMessageFunc( targetId, MessageType.Private );
			await sendMessage( msg );
		} else {
			const sendMessage = bot.message.getSendMessageFunc( -1, MessageType.Group, targetId );
			try {
				await sendMessage( msg, false );
			} catch ( e ) {
				const REMOVE = <Order>bot.command.getSingle( "hot-news.remove_subscribe", AuthLevel.Master );
				const message = `[${ targetId }]的订阅消息发送失败，该群可能被封禁中，可使用${ REMOVE.getHeaders()[0] }指令移除该群聊的订阅`;
				bot.logger.error( message, e );
				await bot.message.sendMaster( message );
			}
		}
	}
}