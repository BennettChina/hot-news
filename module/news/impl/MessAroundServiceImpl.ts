import { NewsService } from "#hot-news/module/news/NewsService";
import { segment } from "oicq"
import bot from "ROOT";
import { DB_KEY } from "#hot-news/util/constants";
import { ChatInfo } from "#hot-news/types/type";
import { getHashField } from "#hot-news/util/RedisUtils";
import { MessageMethod } from "#hot-news/module/message/MessageMethod";
import { getMoyuUrl } from "#hot-news/util/api";

export class MessAroundServiceImpl implements NewsService {
	
	async getInfo( channel?: string ): Promise<string> {
		const url = getMoyuUrl();
		const img = segment.image( url, true, 5000 );
		return segment.toCqcode( img );
	}
	
	async handler(): Promise<void> {
		const set: string[] = await bot.redis.getSet( DB_KEY.ids );
		if ( set.length === 0 ) {
			return;
		}
		
		const msg = await this.getInfo();
		bot.logger.info( `[hot-news]获取到今日摸鱼日报: ${ msg }` );
		for ( let id of set ) {
			const { type, targetId }: ChatInfo = JSON.parse( id );
			
			let channel = await getHashField( DB_KEY.channel, `${ targetId }` );
			if ( !channel ) {
				continue;
			}
			channel = channel.startsWith( "[" ) ? channel : `["${ channel }"]`;
			const channels: string[] = JSON.parse( channel ) || "[]";
			if ( channels.includes( "moyu" ) ) {
				await MessageMethod.sendMsg( type, targetId, msg );
			}
		}
	}
	
}