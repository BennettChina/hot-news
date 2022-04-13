import { MessageType } from "@modules/message";

export const formatDate: ( date: Date ) => string = ( date ) => {
	const dateArr: number[] = [ date.getFullYear(), date.getMonth() + 1, date.getDate() ];
	return dateArr.join( '-' );
}

export const getChatInfo: ( messageData ) => ( { targetId: number; type: MessageType } ) = ( messageData ) => {
	// 获取当前对话的群号或者QQ号
	if ( messageData.message_type === 'group' ) {
		return {
			targetId: messageData.group_id,
			type: MessageType.Group
		};
	} else if ( messageData.message_type === 'private' && messageData.sub_type === 'friend' ) {
		return {
			targetId: messageData.user_id,
			type: MessageType.Private
		};
	} else {
		return {
			targetId: -1,
			type: MessageType.Unknown
		};
	}
}