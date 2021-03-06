import axios, { AxiosError } from "axios";
import bot from 'ROOT';
import { formatDate } from "#hot-news/util/tools";
import { DB_KEY } from "#hot-news/util/constants";
import { BiliDynamicCard, BiliLiveInfo, News } from "#hot-news/types/type";
import moment from "moment";

const API = {
	sina: 'https://www.anyknew.com/api/v1/sites/sina',
	baidu: 'https://www.anyknew.com/api/v1/sites/baidu',
	zhihu: 'https://www.anyknew.com/api/v1/sites/zhihu',
	wangyi: 'https://www.anyknew.com/api/v1/sites/163',
	toutiao: 'https://www.anyknew.com/api/v1/sites/toutiao',
	biliDynamic: "https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space",
	biliInfo: 'https://api.bilibili.com/x/space/acc/info',
	moyu: 'https://api.vvhan.com/api/moyu?type=json',
	moyu2: 'https://api.j4u.ink/proxy/redirect/moyu/calendar/$.png',
}

const NEWS_HEADERS = {
	"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36",
	"Referer": "https://www.anyknew.com/",
	"Accept": "*/*",
	"Accept-Encoding": "gzip, deflate, br",
	"Connection": "keep-alive",
};

const BILIBILI_DYNAMIC_HEADERS = {
	"Origin": "https://space.bilibili.com",
	"Referer": "https://space.bilibili.com/401742377/dynamic",
	"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36",
	"Accept": "application/json, text/plain, */*",
	"Accept-Encoding": "gzip, deflate, br",
	"Connection": "keep-alive"
}

export const getNews: ( channel?: string ) => Promise<string> = async ( channel: string = 'toutiao' ) => {
	let date = formatDate( new Date() );
	let key = `hot_news.news.${ channel }.${ date }`;
	let news = await bot.redis.getString( key );
	if ( news ) {
		return Promise.resolve( news );
	}
	
	return new Promise( ( resolve, reject ) => {
		axios.get( API[channel], { headers: NEWS_HEADERS, timeout: 5000 } ).then( res => {
			if ( res.status !== 200 ) {
				bot.logger.error( `获取[${ channel }]热点新闻失败: ${ res.statusText }` )
				reject( '获取热点新闻失败' )
				return;
			}
			
			if ( res.data.status !== 0 ) {
				bot.logger.error( `获取[${ channel }]热点新闻失败: ${ res.data.msg }` )
				reject( '获取热点新闻失败' )
				return;
			}
			
			const {
				site: {
					attrs: { cn },
					subs: [ { items } ]
				}
			}: News = res.data.data;
			
			news = items.map( ( value, index ) => `${ index + 1 }. ` + value.title ).join( "\n" );
			news = `-- ${ date } --${ cn }\n` + news;
			
			bot.redis.setString( key, news, 3600 ).catch( reason => bot.logger.warn( reason ) );
			
			resolve( news );
		} ).catch( err => {
			reject( err )
		} )
	} );
}

/**
 * 获取B站空间动态列表
 */
export const getBiliDynamicNew: ( uid: number, no_cache?: boolean, cache_time?: number ) => Promise<BiliDynamicCard[]> = async ( uid, no_cache = false, cache_time = 60 ) => {
	const dynamic = await bot.redis.getString( `${ DB_KEY.bili_dynamic_key }.${ uid }` );
	if ( dynamic ) {
		return Promise.resolve( JSON.parse( dynamic ) );
	}
	
	// 已经发布的动态ID
	const dynamicIdList: string[] = await bot.redis.getSet( `${ DB_KEY.bili_dynamic_ids_key }.${ uid }` );
	
	return new Promise( ( resolve ) => {
		axios.get( API.biliDynamic, {
			params: {
				offset: '',
				host_mid: uid,
				timezone_offset: -480
			},
			timeout: 5000,
			headers: BILIBILI_DYNAMIC_HEADERS
		} ).then( r => {
			const data = r.data;
			if ( data.code !== 0 ) {
				bot.logger.error( `获取B站[${ uid }]动态失败,code is [${ data.code }], reason: ${ data.message || data.msg }` );
				resolve( [] );
				return;
			}
			
			const { items }: { items: BiliDynamicCard[] } = data.data;
			const reg = new RegExp( /恭喜.*中奖/ );
			// 无法显示消息、开奖消息、历史消息过滤掉
			let filter_items = items.filter( c => !dynamicIdList.includes( c.id_str )
				&& c.visible
				&& !reg.test( c.modules.module_dynamic.desc?.text || "" ) );
			if ( filter_items.length > 0 ) {
				resolve( filter_items );
				if ( !no_cache ) {
					bot.redis.setString( `${ DB_KEY.bili_dynamic_key }.${ uid }`, JSON.stringify( filter_items ), cache_time );
				}
			} else {
				resolve( [] );
				if ( !no_cache ) {
					bot.redis.setString( `${ DB_KEY.bili_dynamic_key }.${ uid }`, "[]", cache_time );
				}
			}
		} ).catch( ( reason ): any => {
			if ( axios.isAxiosError( reason ) ) {
				let err = <AxiosError>reason;
				bot.logger.error( `获取B站[${ uid }]动态失败, reason: ${ err.message }` );
			} else {
				bot.logger.error( reason );
			}
			resolve( [] )
		} )
	} );
}

export const getBiliLive: ( uid: number, no_cache?: boolean, cache_time?: number ) => Promise<BiliLiveInfo> = async ( uid, no_cache = false, cache_time = 60 ) => {
	const live_info = await bot.redis.getString( `${ DB_KEY.bili_live_info_key }.${ uid }` );
	if ( live_info ) {
		return Promise.resolve( JSON.parse( live_info ) );
	}
	
	return new Promise( ( resolve ) => {
		axios.get( API.biliInfo, {
			params: {
				mid: uid,
				jsonp: 'jsonp'
			},
			timeout: 5000
		} ).then( r => {
			if ( r.data.code !== 0 ) {
				bot.logger.error( `获取B站[${ uid }]个人信息失败,code is [${ r.data.code }], reason: ${ r.data.message || r.data.msg }` );
				return;
			}
			
			const { name, live_room } = r.data.data;
			const info = { name, liveRoom: live_room };
			resolve( info );
			if ( !no_cache ) {
				bot.redis.setString( `${ DB_KEY.bili_live_info_key }.${ uid }`, JSON.stringify( info ), cache_time );
			}
		} ).catch( ( reason ): any => {
			if ( axios.isAxiosError( reason ) ) {
				let err = <AxiosError>reason;
				bot.logger.error( `获取B站[${ uid }]个人信息失败, reason: ${ err.message }` );
			} else {
				bot.logger.error( reason );
			}
		} )
	} );
}

export async function getMoyuImg(): Promise<string> {
	let date = formatDate( new Date() );
	let key = `${ DB_KEY.moyu_img_url_key }.${ date }`;
	const url = await bot.redis.getString( key );
	if ( url ) {
		return url;
	}
	
	return new Promise( resolve => {
		axios.get( API.moyu, { timeout: 5000 } )
			.then( response => {
				if ( response.data.success ) {
					const imgUrl = response.data.url;
					resolve( imgUrl );
					bot.redis.setString( key, imgUrl, 3600 );
				}
			} ).catch( ( reason ): any => {
			if ( axios.isAxiosError( reason ) ) {
				let err = <AxiosError>reason;
				bot.logger.error( `获取摸鱼日报失败, reason: ${ err.message }` );
			} else {
				bot.logger.error( reason );
			}
		} )
	} );
}

export function getMoyuUrl(): string {
	const today: string = moment().format( "yyMMDD" );
	return API.moyu2.replace( "$", today );
}