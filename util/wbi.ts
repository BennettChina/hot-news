import { Md5 } from "md5-typescript";
import fetch from "node-fetch";

type WbiKey = {
	img_key: string;
	sub_key: string;
}

export type WbiSign = {
	wts: number;
	w_rid: string;
}

export type DmImg = {
	dm_img_list: any[],
	dm_img_str: string,
	dm_cover_img_str: string,
	dm_img_inter: {
		ds: any[];
		wh: number[];
		of: number[];
	},
}

const mixinKeyEncTab = [
	46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
	33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
	61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
	36, 20, 34, 44, 52
]

// 对 imgKey 和 subKey 进行字符顺序打乱编码
const getMixinKey = ( orig: string ) => mixinKeyEncTab.map( n => orig[n] ).join( '' ).slice( 0, 32 )

// 为请求参数进行 wbi 签名
export function encWbi( params: object, img_key: string, sub_key: string ): WbiSign {
	const mixin_key = getMixinKey( img_key + sub_key ),
		curr_time = Math.round( Date.now() / 1000 ),
		chr_filter = /[!'()*]/g
	
	Object.assign( params, { wts: curr_time } ) // 添加 wts 字段
	// 按照 key 重排参数
	const query = Object
		.keys( params )
		.sort()
		.map( key => {
			// 过滤 value 中的 "!'()*" 字符
			const value = params[key].toString().replace( chr_filter, '' )
			return `${ encodeURIComponent( key ) }=${ encodeURIComponent( value ) }`
		} )
		.join( '&' )
	
	const wbi_sign = Md5.init( query + mixin_key ) // 计算 w_rid
	
	return {
		wts: curr_time,
		w_rid: wbi_sign
	}
}

// 获取最新的 img_key 和 sub_key
async function getWbiKeys( headers: object ): Promise<WbiKey> {
	const res = await fetch( 'https://api.bilibili.com/x/web-interface/nav', {
		method: "GET",
		headers: {
			"User-Agent": headers["User-Agent"],
			"Referer": headers["Referer"]
		}
	} )
	const { data: { wbi_img: { img_url, sub_url } } } = await res.json()
	
	return {
		img_key: img_url.slice(
			img_url.lastIndexOf( '/' ) + 1,
			img_url.lastIndexOf( '.' )
		),
		sub_key: sub_url.slice(
			sub_url.lastIndexOf( '/' ) + 1,
			sub_url.lastIndexOf( '.' )
		)
	}
}


function randomSample( seed: string, length: number ): string {
	if ( length > seed.length ) {
		throw new Error( 'Sample size exceeds seed size' );
	}
	
	let shuffled = [ ...seed ];
	
	// Fisher-Yates 随机洗牌算法
	for ( let i = shuffled.length - 1; i > 0; i-- ) {
		const j = Math.floor( Math.random() * ( i + 1 ) );
		[ shuffled[i], shuffled[j] ] = [ shuffled[j], shuffled[i] ];
	}
	
	return shuffled.slice( 0, length ).join( '' );
}

/**
 * https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/misc/sign/wbi.md#javascript
 * 生成 wbi 签名
 * @param data 除了 wbi 签名外的全部请求参数
 * @param headers 需要 referer 和 UA 两个请求头
 */
export async function getWbiSign( data: object, headers: object ): Promise<WbiSign> {
	const { img_key, sub_key } = await getWbiKeys( headers );
	return encWbi( data, img_key, sub_key );
}

function getWh( width: number = 1920, height: number = 1080 ): number[] {
	const res0: number = width;
	const res1: number = height;
	const rnd: number = Math.floor( 114 * Math.random() );
	return [ 2 * res0 + 2 * res1 + 3 * rnd, 4 * res0 - res1 + rnd, rnd ];
}

function getOf( scroll_top: number = 10, scroll_left: number = 10 ): number[] {
	const res0: number = scroll_top;
	const res1: number = scroll_left;
	const rnd: number = Math.floor( 514 * Math.random() );
	return [ 3 * res0 + 2 * res1 + rnd, 4 * res0 - 4 * res1 + 2 * rnd, rnd ];
}


/**
 * https://github.com/SocialSisterYi/bilibili-API-collect/issues/868#issuecomment-1919593911
 *
 * 生成 dm_img 相关参数
 */
export const getDmImg = (): DmImg => {
	// const dm_rand = 'ABCDEFGHIJK';
	const dm_img_list = [];
	// const dm_img_str = randomSample( dm_rand, 2 );
	// const dm_cover_img_str = randomSample( dm_rand, 2 );
	// 这俩值可以不用随机，直接用实际的真实值即可。
	const dm_img_str = "V2ViR0wgMS4wIChPcGVuR0wgRVMgMi4wIENocm9taXVtKQ";// base64Decode = WebGL 1.0 (OpenGL ES 2.0 Chromium)
	const dm_cover_img_str = "QU5HTEUgKEludGVsLCBBTkdMRSBNZXRhbCBSZW5kZXJlcjogSW50ZWwoUikgVUhEIEdyYXBoaWNzIDYzMCwgVW5zcGVjaWZpZWQgVmVyc2lvbilHb29nbGUgSW5jLiAoSW50ZW";// base64Decode = ANGLE (Intel Inc., Intel(R) UHD Graphics 630, OpenGL 4.1)Google Inc. (Intel Inc
	const dm_img_inter = { ds: [], wh: getWh(), of: getOf() };
	return {
		dm_img_list,
		dm_img_str,
		dm_cover_img_str,
		dm_img_inter,
	};
};