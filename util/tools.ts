import { isGroupMessage, isPrivateMessage, Message, MessageType } from "@modules/message";
import { ChatInfo } from "#hot-news/types/type";
import { CHANNEL_NAME } from "#hot-news/util/constants";

export const formatDate: ( date: Date ) => string = ( date ) => {
	const dateArr: number[] = [ date.getFullYear(), date.getMonth() + 1, date.getDate() ];
	return dateArr.join( '-' );
}

export const formatTimestamp: ( timestamp: number ) => string = ( timestamp ) => {
	const date = new Date( timestamp );
	const dateArr: number[] = [ date.getFullYear(), date.getMonth() + 1, date.getDate() ];
	return dateArr.join( '-' ) + " " + date.toLocaleTimeString( "zh-CN", { hour12: false } );
}

export const getChatInfo: ( messageData: Message ) => ChatInfo = ( messageData ) => {
	// 获取当前对话的群号或者QQ号
	if ( isGroupMessage( messageData ) ) {
		return {
			targetId: messageData.group_id,
			user_id: messageData.user_id,
			type: MessageType.Group
		};
	} else if ( isPrivateMessage( messageData ) && messageData.sub_type === 'friend' ) {
		return {
			targetId: messageData.user_id,
			user_id: messageData.user_id,
			type: MessageType.Private
		};
	} else {
		return {
			targetId: -1,
			user_id: messageData.user_id,
			type: MessageType.Unknown
		};
	}
}

export const getChannelKey: ( channel: string ) => ( string | number | null ) = ( channel ) => {
	const reg = new RegExp( /\d+/ );
	const isNumber = reg.test( channel );
	if ( isNumber ) {
		return parseInt( reg.exec( channel )![0] );
	}
	
	for ( let k in CHANNEL_NAME ) {
		if ( CHANNEL_NAME[k] === channel ) {
			return k;
		}
	}
	
	return null;
}

/**
 * await实现线程暂定的功能，等同于 sleep
 * @param ms
 */
export async function wait( ms ): Promise<void> {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}
