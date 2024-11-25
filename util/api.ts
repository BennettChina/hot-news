import axios, { AxiosError } from "axios";
import bot from 'ROOT';
import {
	formatDate,
	get_uuid,
	random_audio,
	random_canvas,
	random_png_end,
	randomId,
	transferText
} from "#/hot-news/util/tools";
import { DB_KEY } from "#/hot-news/util/constants";
import {
	BiliDynamicCard,
	BiliLiveInfo,
	BiliOpusDetail,
	BiliUser,
	LiveUserInfo,
	News,
	SixtyNews,
	UpCardInfo
} from "#/hot-news/types/type";
import moment from "moment";
import { config } from "#/hot-news/init";
import fetch, { Response } from "node-fetch";
import UserAgent from 'user-agents';
import { gen_buvid_fp } from "#/hot-news/util/fp";
import { encWbi, getDmImg, getWbiSign } from "#/hot-news/util/wbi";
import { isJsonString } from "@/utils/verify";

const API = {
	sina: 'https://www.anyknew.com/api/v1/sites/sina',
	baidu: 'https://www.anyknew.com/api/v1/sites/baidu',
	zhihu: 'https://www.anyknew.com/api/v1/sites/zhihu',
	wangyi: 'https://www.anyknew.com/api/v1/sites/163',
	toutiao: 'https://www.anyknew.com/api/v1/sites/toutiao',
	biliDynamic: "https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space",
	biliInfo: 'https://api.bilibili.com/x/space/acc/info',
	bili_live_status: 'https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids',
	moyu: 'https://api.vvhan.com/api/moyu?type=json',
	moyu2: 'https://api.j4u.ink/proxy/redirect/moyu/calendar/$.png',
	"60s": 'https://www.zhihu.com/api/v4/columns/c_1715391799055720448/items?limit=2',
	"60s_api": "https://60s.viki.moe/60s?v2=1",
	biliCard: "https://api.bilibili.com/x/web-interface/card",
	biliStat: "https://api.bilibili.com/x/relation/stat",
	biliLiveUserInfo: "https://api.live.bilibili.com/live_user/v1/Master/info",
	biliOpusDetail: "https://api.bilibili.com/x/polymer/web-dynamic/v1/opus/detail",
	biliSearch: "https://api.bilibili.com/x/web-interface/wbi/search/type",
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
	"Referer": "https://space.bilibili.com/$/dynamic",
	"User-Agent": "Mozilla/5.0",
	"Cookie": ""
}

const userAgent = new UserAgent( [ { deviceCategory: 'desktop' }, /Safari|Chrome|FireFox|Edg/ ] );
/**
 * bili fp
 */
type BiliFp = {
	buvid_fp?: string;
	payload: string;
}
const fp: BiliFp = {
	buvid_fp: undefined,
	payload: ""
}
// 风控时fp_count加1，超过10次则重置buvid_fp
let fp_count = 0;

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
 * 获取B站指纹Cookie
 */
async function getCookies( uuid: string ): Promise<void> {
	BILIBILI_DYNAMIC_HEADERS.Cookie = `_uuid=${ uuid }`
	const resp = await axios.get( `https://api.bilibili.com/x/frontend/finger/spi`, {
		headers: BILIBILI_DYNAMIC_HEADERS
	} );
	if ( resp.data.code !== 0 ) {
		bot.logger.error( `[hot-news] 获取B站指纹出错:`, resp.data );
		return;
	}
	BILIBILI_DYNAMIC_HEADERS.Cookie += `;buvid3=${ resp.data.data["b_3"] };buvid4=${ resp.data.data["b_4"] }`;
}

function boolToNum( bool: boolean ) {
	return bool ? 1 : 0;
}

async function abtest_info( uid: number ): Promise<string> {
	try {
		const response = await axios.get( `https://space.bilibili.com/${ uid }/dynamic` );
		const regex = /<script\s+id="abtest"\s*[^>]*>([\s\S]*?)<\/script>/i;
		const matches = regex.exec( response.data );
		if ( matches ) {
			return matches[1].trim().replace( /^window\.abtest\s*=\s*/, '' );
		} else {
			bot.logger.warn( "[hot-news] 未获取到 abtest 信息。" );
			return "";
		}
	} catch ( err ) {
		if ( axios.isAxiosError( err ) ) {
			bot.logger.error( `[hot-news] 获取 abtest 信息失败(AxiosError),`, err.message );
		} else {
			bot.logger.error( `[hot-news] 获取 abtest 信息失败,`, err );
		}
		return "";
	}
}

async function gen_payload( uid: number, randomUA: UserAgent, uuid: string ) {
	const ua = BILIBILI_DYNAMIC_HEADERS["User-Agent"];
	const { screenWidth, screenHeight, viewportHeight, viewportWidth } = randomUA.data;
	const data = {
		"3064": 1,
		"5062": `${ Date.now() }`,
		"03bf": `https%3A%2F%2Fspace.bilibili.com%2F${ uid }%2Fdynamic`,
		"39c8": "333.999.fp.risk",
		"34f1": "",
		"d402": "",
		"654a": "",
		"6e7c": `${ screenWidth }x${ screenHeight }`,
		"3c43": {
			"2673": boolToNum( screenWidth < viewportWidth || screenHeight < viewportHeight ),
			"5766": 24,
			"6527": 0,
			"7003": 1,
			"807e": 1,
			"b8ce": ua,
			"641c": 0,
			"07a4": "zh-CN",
			"1c57": 8,
			"0bd0": 8,
			"748e": [ screenWidth, screenHeight ],
			"d61f": [ viewportWidth, viewportHeight ],
			"fc9d": -480,
			"6aa9": "Asia/Shanghai",
			"75b8": 1,
			"3b21": 1,
			"8a1c": 0,
			"d52f": "not available",
			"adca": ua.includes( "Windows" ) ? "Win32" : ua.includes( "Macintosh" ) ? "MacIntel" : "Linux",
			"80c9": [ [ "PDF Viewer", "Portable Document Format", [ [ "application/pdf", "pdf" ], [ "text/pdf", "pdf" ] ] ], [ "Chrome PDF Viewer", "Portable Document Format", [ [ "application/pdf", "pdf" ], [ "text/pdf", "pdf" ] ] ], [ "Chromium PDF Viewer", "Portable Document Format", [ [ "application/pdf", "pdf" ], [ "text/pdf", "pdf" ] ] ], [ "Microsoft Edge PDF Viewer", "Portable Document Format", [ [ "application/pdf", "pdf" ], [ "text/pdf", "pdf" ] ] ], [ "WebKit built-in PDF", "Portable Document Format", [ [ "application/pdf", "pdf" ], [ "text/pdf", "pdf" ] ] ] ],
			"13ab": random_canvas(),
			"bfe9": random_png_end(),
			"a3c1": [ "extensions:ANGLE_instanced_arrays;EXT_blend_minmax;EXT_color_buffer_half_float;EXT_depth_clamp;EXT_disjoint_timer_query;EXT_float_blend;EXT_frag_depth;EXT_shader_texture_lod;EXT_texture_compression_rgtc;EXT_texture_filter_anisotropic;EXT_sRGB;OES_element_index_uint;OES_fbo_render_mipmap;OES_standard_derivatives;OES_texture_float;OES_texture_float_linear;OES_texture_half_float;OES_texture_half_float_linear;OES_vertex_array_object;WEBGL_blend_func_extended;WEBGL_color_buffer_float;WEBGL_compressed_texture_s3tc;WEBGL_compressed_texture_s3tc_srgb;WEBGL_debug_renderer_info;WEBGL_debug_shaders;WEBGL_depth_texture;WEBGL_draw_buffers;WEBGL_lose_context;WEBGL_multi_draw;WEBGL_polygon_mode", "webgl aliased line width range:[1, 1]", "webgl aliased point size range:[1, 255.875]", "webgl alpha bits:8", "webgl antialiasing:yes", "webgl blue bits:8", "webgl depth bits:24", "webgl green bits:8", "webgl max anisotropy:16", "webgl max combined texture image units:32", "webgl max cube map texture size:16384", "webgl max fragment uniform vectors:1024", "webgl max render buffer size:16384", "webgl max texture image units:16", "webgl max texture size:16384", "webgl max varying vectors:15", "webgl max vertex attribs:16", "webgl max vertex texture image units:16", "webgl max vertex uniform vectors:1024", "webgl max viewport dims:[16384, 16384]", "webgl red bits:8", "webgl renderer:WebKit WebGL", "webgl shading language version:WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)", "webgl stencil bits:0", "webgl vendor:WebKit", "webgl version:WebGL 1.0 (OpenGL ES 2.0 Chromium)", "webgl unmasked vendor:Google Inc. (Intel Inc.)", "webgl unmasked renderer:ANGLE (Intel Inc., Intel(R) UHD Graphics 630, OpenGL 4.1)", "webgl vertex shader high float precision:23", "webgl vertex shader high float precision rangeMin:127", "webgl vertex shader high float precision rangeMax:127", "webgl vertex shader medium float precision:23", "webgl vertex shader medium float precision rangeMin:127", "webgl vertex shader medium float precision rangeMax:127", "webgl vertex shader low float precision:23", "webgl vertex shader low float precision rangeMin:127", "webgl vertex shader low float precision rangeMax:127", "webgl fragment shader high float precision:23", "webgl fragment shader high float precision rangeMin:127", "webgl fragment shader high float precision rangeMax:127", "webgl fragment shader medium float precision:23", "webgl fragment shader medium float precision rangeMin:127", "webgl fragment shader medium float precision rangeMax:127", "webgl fragment shader low float precision:23", "webgl fragment shader low float precision rangeMin:127", "webgl fragment shader low float precision rangeMax:127", "webgl vertex shader high int precision:0", "webgl vertex shader high int precision rangeMin:31", "webgl vertex shader high int precision rangeMax:30", "webgl vertex shader medium int precision:0", "webgl vertex shader medium int precision rangeMin:31", "webgl vertex shader medium int precision rangeMax:30", "webgl vertex shader low int precision:0", "webgl vertex shader low int precision rangeMin:31", "webgl vertex shader low int precision rangeMax:30", "webgl fragment shader high int precision:0", "webgl fragment shader high int precision rangeMin:31", "webgl fragment shader high int precision rangeMax:30", "webgl fragment shader medium int precision:0", "webgl fragment shader medium int precision rangeMin:31", "webgl fragment shader medium int precision rangeMax:30", "webgl fragment shader low int precision:0", "webgl fragment shader low int precision rangeMin:31", "webgl fragment shader low int precision rangeMax:30" ],
			"6bc5": "Google Inc. (Intel Inc.)~ANGLE (Intel Inc., Intel(R) UHD Graphics 630, OpenGL 4.1)",
			"ed31": 0,
			"72bd": 0,
			"097b": 0,
			"52cd": [ 0, 0, 0 ],
			"a658": [ "Andale Mono", "Arial", "Arial Black", "Arial Hebrew", "Arial Narrow", "Arial Rounded MT Bold", "Arial Unicode MS", "Comic Sans MS", "Courier", "Courier New", "Geneva", "Georgia", "Helvetica", "Helvetica Neue", "Impact", "LUCIDA GRANDE", "Microsoft Sans Serif", "Monaco", "Palatino", "Tahoma", "Times", "Times New Roman", "Trebuchet MS", "Verdana", "Wingdings", "Wingdings 2", "Wingdings 3" ],
			"d02f": random_audio()
		},
		"54ef": await abtest_info( uid ),
		"8b94": "",
		"df35": uuid,
		"07a4": "zh-CN",
		"5f45": null,
		"db46": 0
	}
	return JSON.stringify( data );
}

/**
 * 上报并激活指纹Cookie
 */
async function submitGateway( uid: number, randomUA: UserAgent, uuid: string ): Promise<void> {
	// 如果已经生成的有就一直用，初次会 -352 ，后续就可正常使用，且该 cookie 值服务端会自动续期
	if ( !fp.buvid_fp ) {
		const payload = await gen_payload( uid, randomUA, uuid );
		fp.buvid_fp = gen_buvid_fp( payload, 31 );
		fp.payload = payload;
	}
	BILIBILI_DYNAMIC_HEADERS.Cookie += `;buvid_fp=${ fp.buvid_fp }`
	await axios.post( "https://api.bilibili.com/x/internal/gaia-gateway/ExClimbWuzhi", {
		payload: fp.payload
	}, {
		headers: BILIBILI_DYNAMIC_HEADERS
	} )
}

async function getBiliDynamicList( uid: number ): Promise<BiliDynamicCard[]> {
	BILIBILI_DYNAMIC_HEADERS["User-Agent"] = userAgent.toString();
	BILIBILI_DYNAMIC_HEADERS.Referer = BILIBILI_DYNAMIC_HEADERS.Referer.replace( /\$|\d+/, `${ uid }` );
	
	// 获取Cookie
	if ( !config.cookie ) {
		const uuid = get_uuid();
		await getCookies( uuid );
		await submitGateway( uid, userAgent, uuid );
	} else {
		BILIBILI_DYNAMIC_HEADERS.Cookie = config.cookie;
	}
	
	const data = {
		offset: '',
		host_mid: uid,
		timezone_offset: -480,
		platform: 'web',
		features: "itemOpusStyle,listOnlyfans,opusBigCover,onlyfansVote,decorationCard,forwardListHidden,ugcDelete,onlyfansQaCard",
		web_location: "333.999",
		...getDmImg(),
		"x-bili-device-req-json": { "platform": "web", "device": "pc" },
		"x-bili-web-req-json": { "spm_id": "333.999" }
	}
	const { wts, w_rid } = await getWbiSign( data, BILIBILI_DYNAMIC_HEADERS );
	const params = {
		...data,
		wts,
		w_rid
	};
	
	const resp = await axios.get( API.biliDynamic, {
		params,
		timeout: 5000,
		headers: BILIBILI_DYNAMIC_HEADERS
	} );
	
	if ( resp.data.code === -352 ) {
		fp_count++;
		bot.logger.warn( `获取B站[${ uid }]动态遇到风控。` );
		if ( fp_count > 10 ) {
			bot.logger.info( "风控次数超过10次，将重置指纹并重新生成。" );
			fp.buvid_fp = undefined;
			fp.payload = "";
			fp_count = 0;
		}
		return [];
	}
	
	if ( resp.data.code !== 0 ) {
		bot.logger.error( `获取B站[${ uid }]动态失败,`, resp.data );
		return [];
	}
	
	const { items }: { items: BiliDynamicCard[] } = resp.data.data;
	let filter_items: BiliDynamicCard[];
	// 无法显示消息、历史消息、以及自定义过滤内容过滤掉
	const filterDynamicType = config.filterDynamicType;
	const reg = new RegExp( config.filterContent );
	// 已经发布的动态ID
	const dynamicIdList: string[] = await bot.redis.getSet( `${ DB_KEY.bili_dynamic_ids_key }.${ uid }` );
	filter_items = items
		// 过滤已缓存的ID
		.filter( c => !dynamicIdList.includes( c.id_str ) && c.visible )
		// 过滤全部类型动态的文字内容
		.filter( c => {
			return config.filterContent ? !new RegExp( config.filterContent ).test( c.modules.module_dynamic.desc?.text || "" ) : true;
		} )
		// 按动态类型进行不同的匹配方式(主要处理转发类型)
		.filter( card => {
			if ( filterDynamicType.length === 0 ) {
				return true;
			}
			for ( let value of filterDynamicType ) {
				let result: boolean = true;
				// 转发动态去匹配原动态内容及tag
				if ( card.type === value.type && value.type === 'DYNAMIC_TYPE_FORWARD' ) {
					const richTextNodes = card.orig!.modules.module_dynamic.desc?.rich_text_nodes || [];
					const text = card.orig!.modules.module_dynamic.desc?.text || "";
					const content: string = richTextNodes?.map( node => node.text ).join() + text;
					result = value.reg ?
						!new RegExp( value.reg ).test( content )
						: false;
				} else if ( card.type === value.type ) {
					// 其他类型动态暂且只匹配动态的文字内容及tag
					result = value.reg ? !new RegExp( value.reg ).test( card.modules.module_dynamic.desc?.text || "" ) : false;
				} else {
					result = true;
				}
				if ( !result ) {
					bot.logger.info( "保存已过滤的消息: ", card.id_str, "触发的规则是：", filterDynamicType );
					if ( !dynamicIdList.includes( card.id_str ) ) {
						bot.redis.addSetMember( `${ DB_KEY.bili_dynamic_ids_key }.${ uid }`, card.id_str );
						dynamicIdList.push( card.id_str );
					}
					return false;
				}
			}
			return true;
		} );
	
	// 把过滤掉的消息ID保存，避免后续查询因为触发反爬虫导致又被推送
	items.filter( c => !dynamicIdList.includes( c.id_str )
		&& c.visible
		&& reg.test( c.modules.module_dynamic.desc?.text || "" ) ).forEach( value => {
		bot.logger.info( "保存已过滤的消息: ", value.id_str, "触发的规则是：", `${ config.filterContent }` );
		bot.redis.addSetMember( `${ DB_KEY.bili_dynamic_ids_key }.${ uid }`, value.id_str );
	} );
	
	if ( filter_items.length > 0 ) {
		return filter_items;
	}
	
	return [];
}

/**
 * @description 获取B站空间动态列表
 * @param {number} uid 用户UID
 * @returns {Promise<BiliDynamicCard[]>}
 */
export async function getBiliDynamicNew( uid: number ): Promise<BiliDynamicCard[]> {
	try {
		return await getBiliDynamicList( uid );
	} catch ( reason ) {
		if ( axios.isAxiosError( reason ) ) {
			let err = <AxiosError>reason;
			bot.logger.error( `获取B站[${ uid }]动态失败(axiosError), reason: ${ err.message }` );
		} else {
			bot.logger.error( `获取B站[${ uid }]动态失败, reason:`, reason );
		}
		return [];
	}
}

/**
 * @deprecated
 * @param uid 订阅的uid
 * @param no_cache 是否用缓存
 * @param cache_time 缓存时间
 */
export const getBiliLive: ( uid: number, no_cache?: boolean, cache_time?: number ) => Promise<BiliLiveInfo> = async ( uid, no_cache = false, cache_time = 60 ) => {
	//region 折叠这部分代码，该接口需要经常调整，暂时不维护，目前有其他接口可以获取直播间信息
	const live_info = await bot.redis.getString( `${ DB_KEY.bili_live_info_key }.${ uid }` );
	if ( live_info ) {
		return Promise.resolve( JSON.parse( live_info ) );
	}
	
	BILIBILI_DYNAMIC_HEADERS.Referer = `https://space.bilibili.com/${ uid }`;
	return new Promise( ( resolve ) => {
		axios.get( API.biliInfo, {
			params: {
				mid: uid,
				jsonp: 'jsonp',
				platform: 'web',
				token: ''
			},
			headers: BILIBILI_DYNAMIC_HEADERS,
			timeout: 5000
		} ).then( r => {
			if ( r.data.code !== 0 ) {
				bot.logger.error( `获取B站[${ uid }]个人信息失败,code is [${ r.data.code }], reason: ${ r.data.message || r.data.msg }` );
				return;
			}
			
			const { name, live_room } = r.data.data;
			const info = { name, liveRoom: live_room };
			info.liveRoom.live_time = 0;
			resolve( info );
			if ( !no_cache ) {
				bot.redis.setString( `${ DB_KEY.bili_live_info_key }.${ uid }`, JSON.stringify( info ), cache_time );
			}
		} ).catch( ( reason ): any => {
			if ( axios.isAxiosError( reason ) ) {
				let err = <AxiosError>reason;
				bot.logger.error( `获取B站[${ uid }]个人信息失败(axiosError), reason: ${ err.message }` );
			} else {
				bot.logger.error( `获取B站[${ uid }]个人信息失败, reason:`, reason );
			}
			const info = {
				liveRoom: {
					liveStatus: -1,
					roomStatus: 1,
					title: "",
					url: `https://live.bilibili.com/`,
					cover: "",
					live_time: 0,
					watched_show: {
						switch: true,
						num: 0,
						text_small: "",
						text_large: ""
					},
					room_id: 0,
					short_id: 0,
					area_name: '',
					area_v2_name: '',
					area_v2_parent_name: '',
					face: '',
					tag_name: ''
				},
				name: uid.toString( 10 )
			}
			resolve( info );
		} )
	} );
	//endregion
}

export async function batchGetBiliUserNames( uids: number[] ) {
	if ( !uids || uids.length === 0 ) return;
	const response = await axios.get( API.bili_live_status, {
		params: {
			uids
		},
		headers: BILIBILI_DYNAMIC_HEADERS,
		timeout: 5000
	} );
	
	if ( response.data.code !== 0 ) {
		bot.logger.error( `查询B站用户昵称失败,code is [${ response.data.code }], reason: ${ response.data.message || response.data.msg }` );
		return;
	}
	
	if ( Array.isArray( response.data.data ) ) {
		return;
	}
	
	const data = response.data.data;
	const result: { [uid: number]: string } = {};
	for ( const uid in data ) {
		result[parseInt( uid )] = data[uid].uname;
	}
	return result;
}

async function getBiliLiveInfo( uid: number ): Promise<BiliLiveInfo | undefined> {
	const response = await axios.get( API.bili_live_status, {
		params: {
			"uids[]": uid
		},
		headers: BILIBILI_DYNAMIC_HEADERS,
		timeout: 5000
	} );
	
	if ( response.data.code !== 0 ) {
		bot.logger.error( `获取B站[${ uid }]直播间状态失败,code is [${ response.data.code }], reason: ${ response.data.message || response.data.msg }` );
		return;
	}
	
	if ( Array.isArray( response.data.data ) ) {
		return;
	}
	
	const {
		title, uname, online, live_status, live_time, cover_from_user, room_id, short_id,
		area_name, area_v2_name, area_v2_parent_name, face, tag_name
	} = response.data.data[uid];
	return {
		liveRoom: {
			liveStatus: live_status,
			roomStatus: 1,
			title,
			url: `https://live.bilibili.com/${ short_id === 0 ? room_id : short_id }`,
			cover: cover_from_user,
			live_time,
			watched_show: {
				switch: true,
				num: online,
				text_small: "",
				text_large: ""
			},
			room_id,
			short_id,
			area_name,
			area_v2_name,
			area_v2_parent_name,
			face,
			tag_name
		},
		name: uname
	};
}

/**
 * @description 获取直播间状态的 API
 * @param {number} uid 订阅的uid
 * @returns {Promise<BiliLiveInfo>}
 */
export async function getBiliLiveStatus( uid: number ): Promise<BiliLiveInfo | undefined> {
	try {
		return await getBiliLiveInfo( uid );
	} catch ( reason ) {
		if ( axios.isAxiosError( reason ) ) {
			let err = <AxiosError>reason;
			bot.logger.error( `获取B站[${ uid }]直播间状态失败(axiosError), reason: ${ err.message }` );
		} else {
			bot.logger.error( `获取B站[${ uid }]直播间状态失败, reason:`, reason );
		}
	}
}

export async function getMoyuImg(): Promise<string> {
	let date = formatDate( new Date() );
	let key = `${ DB_KEY.moyu_img_url_key }.${ date }`;
	const url = await bot.redis.getString( key );
	if ( url ) {
		return url;
	}
	
	let baseurl: string = API.moyu;
	let headers = {};
	if ( config.vvhanCdn ) {
		baseurl = baseurl.replace( "https://api.vvhan.com", config.vvhanCdn );
		headers = {
			"Referer": "https://hibennett.cn/?bot=SilveryStar/Adachi-BOT&plugin=hot-news&version=v1"
		}
	}
	
	return new Promise( resolve => {
		axios.get( baseurl, { timeout: 5000, headers } )
			.then( response => {
				if ( response.data.success ) {
					const imgUrl = response.data.url;
					resolve( imgUrl );
					bot.redis.setString( key, imgUrl, 3600 );
				}
			} ).catch( ( reason ): any => {
			if ( axios.isAxiosError( reason ) ) {
				let err = <AxiosError>reason;
				bot.logger.error( `获取摸鱼日报失败(axiosError), reason: ${ err.message }` );
			} else {
				bot.logger.error( "获取摸鱼日报失败, reason:", reason );
			}
		} )
	} );
}

export function getMoyuUrl(): string {
	const today: string = moment().format( "yyMMDD" );
	return API.moyu2.replace( "$", today );
}

/**
 * @description 存储当日 60s 新闻
 * @deprecated need user cookie
 */
export async function set60s(): Promise<boolean> {
	const todayStr = moment().format( "MM月DD日" );
	let key = `${ DB_KEY["60s_img_data_key"] }.${ moment().format( "yyyyMMDD" ) }`;
	
	const cache = await bot.redis.getString( key );
	if ( isJsonString( cache ) ) return true;
	
	try {
		const response = await axios.get( API["60s"], {
			headers: {
				"User-Agent": userAgent.toString()
			}
		} );
		const data = response.data.data || [];
		const { content = '', title_image = '', updated = 0 } = data[0];
		// 不是今天的新闻就不再处理了
		if ( !moment( updated * 1000 ).isSame( Date.now(), 'day' ) ) {
			return false;
		}
		// copy from https://github.com/vikiboss/60s/blob/main/src/services/60s.ts
		const reg = /<p\s+data-pid=[^<>]+>([^<>]+)<\/p>/g;
		const tagReg = /<[^<>]+>/g;
		const contents: string[] = content.match( reg ) ?? [];
		const mapFn = ( e: string ) => transferText( e.replace( tagReg, '' ).trim(), 'a2u' );
		const result = contents.map( mapFn );
		if ( !result.length ) return false;
		
		const news = ( result || [] ).map( ( e ) => {
			return e
				.replace( /^\d+、\s*/g, '' )
				.replace( /。$/, '' )
				.trim()
		} )
		
		const sixtyNews: SixtyNews = {
			title: "在这里每天60秒读懂世界",
			banner: title_image,
			time: todayStr,
			data: news
		};
		
		await bot.redis.setString( key, JSON.stringify( sixtyNews ), 3600 );
		return true;
	} catch ( reason ) {
		if ( axios.isAxiosError( reason ) ) {
			const err = <AxiosError>reason;
			throw new Error( `[hot-news] - 获取60秒新闻图失败(axiosError), reason: ${ err.message }` );
		} else {
			throw new Error( `[hot-news] - 获取60秒新闻图失败, reason: ${ reason }` );
		}
	}
}

export async function set60sFromApi( api: string = API["60s_api"] ): Promise<boolean> {
	const todayStr = moment().format( "MM月DD日" );
	let key = `${ DB_KEY["60s_img_data_key"] }.${ moment().format( "yyyyMMDD" ) }`;
	
	const cache = await bot.redis.getString( key );
	if ( isJsonString( cache ) ) return true;
	
	const response = await axios.get( api )
		.catch( ( reason: AxiosError ) => {
			throw new Error( reason.message );
		} );
	if ( response.data.status !== 200 ) {
		throw new Error( response.data.message );
	}
	
	const { news, tip, cover } = response.data.data;
	
	const sixtyNews: SixtyNews = {
		title: "在这里每天60秒读懂世界",
		banner: cover,
		time: todayStr,
		data: news,
		tip
	};
	
	await bot.redis.setString( key, JSON.stringify( sixtyNews ), 3600 );
	return true;
}

export async function getUpInfoFromArticle( uid: number, jump_url: string ): Promise<UpCardInfo | undefined> {
	try {
		const result: Response = await fetch( `${ API.biliCard }?mid=${ uid }&article=true`, {
			headers: {
				origin: "https://www.bilibili.com",
				referer: `https:${ jump_url }?spm_id_from=333.999.list.card_opus.click`
			},
			method: "GET"
		} );
		const data = await result.json();
		if ( data.code === 0 ) {
			const { follower, article_count, card: { vip: { status } } } = data.data;
			return Promise.resolve( {
				follower,
				article_count,
				vip_status: status
			} );
		}
	} catch ( e ) {
		bot.logger.error( `[hot-news] 获取UP:${ uid } 的数据失败`, e );
	}
}

export async function getArticleHtml( jump_url: string ): Promise<string> {
	const ua = userAgent.random().toString();
	const response: Response = await fetch( `https:${ jump_url }`, {
		headers: {
			"User-Agent": ua
		}
	} );
	return await response.text();
}

/**
 * 过渡版本接口(暂时先不用)
 * @param opus_id 动态ID
 */
export async function getOpusDetail( opus_id: string ): Promise<BiliOpusDetail> {
	const resp = await axios.get( API.biliOpusDetail, {
		params: {
			id: opus_id,
			timezone_offset: new Date().getTimezoneOffset()
		},
		timeout: 10000
	} );
	if ( resp.data.code !== 0 ) {
		return Promise.reject( resp.data.message );
	}
	
	return resp.data.data.item;
}

export async function getUpStat( uid: number ): Promise<{ follower: number } | undefined> {
	try {
		const response: Response = await fetch( `${ API.biliStat }?vmid=${ uid }&jsonp=jsonp` );
		const data = await response.json();
		if ( data.code === 0 ) {
			const { follower } = data.data;
			return Promise.resolve( {
				follower
			} );
		}
		bot.logger.error( `[hot-news] 获取UP: ${ uid } 状态数据失败, reason: ${ data.message }` );
	} catch ( e ) {
		bot.logger.error( `[hot-news] 获取UP: ${ uid } 状态数据失败`, e );
	}
}

export async function getLiveUserInfo( uid: number ): Promise<LiveUserInfo | undefined> {
	try {
		const response: Response = await fetch( `${ API.biliLiveUserInfo }?uid=${ uid }` );
		const data = await response.json();
		if ( data.code === 0 ) {
			const {
				exp: { master_level: { level, color } },
				follower_num,
				info: { official_verify: { type }, uname }
			} = data.data;
			return Promise.resolve( {
				follower_num,
				level,
				color,
				official_type: type,
				uname
			} );
		}
		bot.logger.error( `[hot-news] 获取UP: ${ uid } 状态数据失败, reason: ${ data.message }` );
	} catch ( e ) {
		bot.logger.error( `[hot-news] 获取UP: ${ uid } 状态数据失败`, e );
	}
}

async function getHomeCookie() {
	const response = await axios.get( "https://bilibili.com/" );
	return response.headers['set-cookie']!.map( item => {
		return item.split( ';' )[0]
	} ).join( ";" )
}

export async function searchBili( keyword: string, search_type: string = "bili_user" ) {
	const cookie = await getHomeCookie();
	const data = {
		keyword,
		search_type,
		ad_resource: "5646",
		category_id: "",
		order: "",
		order_sort: 0,
		user_type: 0,
		duration: "",
		__refresh__: true,
		_extra: "",
		context: "",
		page: 1,
		page_size: 36,
		from_source: "",
		from_spmid: "333.337",
		platform: "pc",
		highlight: "1",
		single_column: "0",
		qv_id: randomId( 32, '0-9a-zA-Z' ),
		source_tag: "3",
		gaia_vtoken: "",
		dynamic_offset: 0,
		web_location: "1430654",
	}
	const img_key = "76e91e21c4df4e16af9467fd6f3e1095";
	const sub_key = "ddfca332d157450784b807c59cd7921e";
	const { wts, w_rid } = encWbi( data, img_key, sub_key );
	const response = await axios.get( API.biliSearch, {
		params: {
			...data,
			wts,
			w_rid
		},
		headers: {
			'User-Agent': userAgent.random().toString(),
			'Cookie': cookie
		}
	} );
	if ( response.data.code !== 0 ) {
		return Promise.reject( response.data.message );
	}
	return response.data.data.result;
}

export async function searchBiliUser( keyword: string ): Promise<BiliUser | string> {
	try {
		const response = await searchBili( keyword );
		if ( !Array.isArray( response ) ) {
			bot.logger.warn( "[hot-news] 搜索用户失败, 接口返回数据格式错误。", JSON.stringify( response ) );
			return "搜索用户失败，接口返回数据格式错误";
		}
		return response[0];
	} catch ( error ) {
		if ( axios.isAxiosError( error ) ) {
			let err = <AxiosError>error;
			bot.logger.error( `[hot-news] 搜索用户失败(axiosError), reason: ${ err.message }` );
			return "搜索用户失败，网络错误";
		}
		bot.logger.error( "[hot-news] 搜索用户失败", error );
		if ( typeof error === "string" ) {
			return `搜索用户失败，${ error }`;
		}
		return "搜索用户失败";
	}
}