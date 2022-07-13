import { NewsService } from "#hot-news/module/news/NewsService";
import { getNews } from "#hot-news/util/api";
import { DB_KEY } from "#hot-news/util/constants";
import { ChatInfo } from "#hot-news/types/type";
import { getHashField } from "#hot-news/util/RedisUtils";
import bot from "ROOT";
import { MessageMethod } from "#hot-news/module/message/MessageMethod";

/**
 * 热点新闻服务
 */
export class HotNewsServiceImpl implements NewsService {
	
	getInfo( channel?: string ): Promise<string> {
		if ( channel ) {
			return getNews( `${ channel }` );
		}
		
		throw '[HotNewsServiceImpl]#getInfo的channel为必须参数';
	}
	
	async handler(): Promise<void> {
		const set: string[] = await bot.redis.getSet( DB_KEY.ids );
		if ( set.length === 0 ) {
			return;
		}
		const news_channel = [ "toutiao", "sina", "wangyi", "zhihu", "baidu" ];
		for ( let id of set ) {
			const { type, targetId }: ChatInfo = JSON.parse( id );
			
			let channel = await getHashField( DB_KEY.channel, `${ targetId }` );
			channel = channel.startsWith( "[" ) ? channel : `[${ channel }]`
			
			let channels: string[] = JSON.parse( channel );
			
			channels = channels.filter( c => news_channel.includes( c ) );
			for ( let c of channels ) {
				const news = await getNews( c );
				await MessageMethod.sendMsg( type, targetId, news );
			}
		}
	}
	
	
}