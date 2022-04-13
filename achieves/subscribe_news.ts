import { InputParameter } from "@modules/command";
import { MessageType } from "@modules/message";
import { getNews } from "#hot-news/util/api";
import { getChatInfo } from "#hot-news/util/tools";

export const CHANNEL_NAME = {
	toutiao: '头条',
	sina: '新浪',
	wangyi: '网易',
	zhihu: '知乎',
	baidu: '百度'
}

export const DB_KEY = {
	ids: "hot_news.subscribe_ids",
	channel: "hot_news.subscribe_channel"
}

export const getChannelKey: ( channel: string ) => ( string | null ) = ( channel ) => {
	for ( let k in CHANNEL_NAME ) {
		if ( CHANNEL_NAME[k] === channel ) {
			return k;
		}
	}
	
	return null;
}


export async function main( { sendMessage, messageData, redis, client, config }: InputParameter ): Promise<void> {
	const channel = messageData.raw_message || '头条';
	const { type, targetId } = getChatInfo( messageData );
	if ( type === MessageType.Unknown ) {
		await sendMessage( '不支持的聊天来源,请在需要订阅的群里或者好友对话中使用!' );
		return;
	}
	
	let channelKey = getChannelKey( channel )
	if ( !channelKey ) {
		const useChannel: string[] = [];
		for ( let k in CHANNEL_NAME ) {
			useChannel.push( CHANNEL_NAME[k] )
		}
		await sendMessage( `新闻源[${ channel }]不是可用的选择,可选择${ useChannel.toString() }` );
		return;
	}
	
	const db_data = JSON.stringify( { targetId, type } );
	
	if ( type === MessageType.Private ) {
		client.getStrangerInfo( targetId ).then( res => {
			if ( res.retcode !== 0 ) {
				sendMessage( `[${ targetId }]不是一个QQ号` );
				return;
			}
		} )
		
		await redis.setHash( DB_KEY.channel, { [`${ targetId }`]: channelKey } );
		redis.addSetMember( DB_KEY.ids, db_data ).then( () => {
			sendMessage( `[${ targetId }]已订阅[${ channel }]新闻。` );
			getNews( channelKey! ).then( news => {
				client.sendPrivateMsg( targetId, news );
			} );
		} );
	} else {
		// 检查bot是否在用户设置到群里
		client.getGroupMemberInfo( targetId, config.number ).then( res => {
			if ( res.retcode !== 0 ) {
				sendMessage( 'BOT未加入该群，请核实群号！' );
				return;
			}
		} )
		
		await redis.setHash( DB_KEY.channel, { [`${ targetId }`]: channelKey } );
		redis.addSetMember( DB_KEY.ids, db_data ).then( () => {
			sendMessage( `[${ targetId }]已订阅[${ channel }]新闻。` );
			getNews( channelKey! ).then( news => {
				client.sendGroupMsg( targetId, news );
			} );
		} );
	}
	
}