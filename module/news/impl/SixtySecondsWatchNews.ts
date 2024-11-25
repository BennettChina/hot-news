import { NewsService } from "#/hot-news/module/news/NewsService";
import { Sendable } from "@/modules/lib";
import bot from "ROOT";
import { DB_KEY } from "#/hot-news/util/constants";
import { MessageMethod } from "#/hot-news/module/message/MessageMethod";
import { set60sFromApi } from "#/hot-news/util/api";
import { getTargetQQMap } from "#/hot-news/util/format";
import { config, renderer } from "#/hot-news/init";

/**
 * 60s看到世界新闻，返回一张图片
 */
export class SixtySecondsWatchNews implements NewsService {
	async getInfo(): Promise<Sendable> {
		const result = await set60sFromApi( config.sixtyApi || undefined );
		if ( !result ) {
			return "暂未获取到今日的60s新闻，请稍后再试";
		}
		const res = await renderer.asSegment( "/sixty/index.html" )
		if ( res.code === "ok" ) {
			return res.data;
		} else {
			throw new Error( res.error );
		}
	}
	
	async handler(): Promise<void> {
		const subs = await bot.redis.getHash( DB_KEY.channel );
		const channel_qq_map = getTargetQQMap<string>( subs, value => {
			return value.startsWith( "[" ) ? value : `["${ value }"]`;
		} );
		
		const qq_list = channel_qq_map.get( "60sNews" );
		
		if ( !qq_list?.size ) return;
		
		let msg: Sendable = "";
		try {
			msg = await this.getInfo();
		} catch ( error ) {
			throw error;
		}
		
		bot.logger.info( `[hot-news] - 获取到60s新闻图: `, msg );
		for ( const qq of qq_list ) {
			const type = await bot.redis.getHashField( DB_KEY.subscribe_chat_info_key, qq );
			await MessageMethod.sendMsg( parseInt( type ), parseInt( qq ), msg );
		}
	}
	
}