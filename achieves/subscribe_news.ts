import { InputParameter } from "@modules/command";
import { MessageType } from "@modules/message";
import { getNews } from "#hot-news/util/api";
import { getChatInfo } from "#hot-news/util/tools";
import { AuthLevel } from "@modules/management/auth";

export const CHANNEL_NAME = {
	toutiao: '头条',
	sina: '新浪',
	wangyi: '网易',
	zhihu: '知乎',
	baidu: '百度',
	genshin: '原神'
}

export const DB_KEY = {
	ids: "hot_news.subscribe_ids",
	channel: "hot_news.subscribe_channel",
	genshin_ids: 'hot_news.sub_genshin_ids',
	genshin_live_notified: 'hot_news.genshin_live_notified',
	genshin_dynamic_ids_key: 'hot_news.genshin_dynamic_ids',
	genshin_dynamic_key: 'hot_news.genshin_dynamic',
	genshin_live_info_key: 'hot_news.genshin_live_info',
}

export const getChannelKey: ( channel: string ) => ( string | null ) = ( channel ) => {
	for ( let k in CHANNEL_NAME ) {
		if ( CHANNEL_NAME[k] === channel ) {
			return k;
		}
	}
	
	return null;
}


export async function main( { sendMessage, messageData, redis, auth }: InputParameter ): Promise<void> {
	const channel = messageData.raw_message || '头条';
	const { type, targetId, user_id } = getChatInfo( messageData );
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
	
	if ( type === MessageType.Group ) {
		const check = await auth.check( user_id, AuthLevel.Manager )
		if ( !check ) {
			await sendMessage( '您的权限不能使用该指令', true );
			return;
		}
	}
	
	// 处理原神B站动态订阅
	if ( channel === CHANNEL_NAME.genshin ) {
		await redis.addSetMember( DB_KEY.genshin_ids, db_data );
		await sendMessage( `[${ targetId }]已订阅B站原神动态和直播。` );
		return;
	}
	
	// 处理新闻订阅
	await redis.setHash( DB_KEY.channel, { [`${ targetId }`]: channelKey } );
	redis.addSetMember( DB_KEY.ids, db_data ).then( () => {
		sendMessage( `[${ targetId }]已订阅[${ channel }]新闻。` );
		getNews( channelKey! ).then( news => {
			sendMessage( news );
		} );
	} );
	
}