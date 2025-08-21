import { BiliBiliHeader } from "#/hot-news/types/type";
import axios from "axios";

type ExGetAxe = {
	version: string;
	public_key: string;
	deadline: number;
}

type EnvInfo = {
	buvid_fp: string;
	userAgent: string;
	webdriver: number;
	language: string;
	colorDepth: number;
	deviceMemory: number;
	hardwareConcurrency: number;
	screenResolution: number[];
	availableScreenResolution: number[];
	timezoneOffset: number;
	timezone: string;
	sessionStorage: number;
	localStorage: number;
	indexedDb: number;
	addBehavior: number;
	openDatabase: number;
	cpuClass: string;
	platform: string;
	plugins: any[][];
	canvas: string;
	webgl_str: string;
	webgl_params: string[];
	webglVendorAndRenderer: string;
	hasLiedLanguages: number;
	hasLiedResolution: number;
	hasLiedOs: number;
	hasLiedBrowser: number;
	touchSupport: number[];
	fonts: string[];
	audio: string;
	os_source: string;
	nav_languages: string[];
	nav_productsub: string;
	eval_length: number;
	user_agent: string;
	screen_size_info: string;
	window_size_info: string;
	local_time: number;
	os_platform: string;
	accept: string;
	accept_encoding: string;
	accept_language: string;
	cookieEnabled: number;
	browser_build_version: string;
	notify_message_api: string;
	spmid: string;
	path: string;
	lsid: string;
	b_nut_h: number;
	collect_api: string;
	buvid: string;
	mid: string;
	sdk_version: string;
}

export type EncryptData = {
	data: string;
	key: string;
}

export async function getPublicKey( headers: BiliBiliHeader ): Promise<ExGetAxe> {
	const resp = await axios.get( "https://api.bilibili.com/x/internal/gaia-gateway/ExGetAxe", {
		headers,
	} ).catch( ( error ) => {
		return Promise.reject( error.message );
	} );
	if ( resp.data.code !== 0 ) {
		return Promise.reject( `公钥获取失败: ${ resp.data.message }` );
	}
	return resp.data.data;
}

export function envInfo(): string {
	return "";
}

const CHECK_MEASURES = [
	// 检测 Selenium、Phantom、WebDriver 等自动化工具的特征标识
	0,
	// 检测 jsdom、Node.js、happy-dom 等无头浏览器环境
	0,
	// 检测核心 JavaScript API 是否被修改（如 Object、Function、JSON、Date、Promise 等原生方法）
	0,
	// 检测时区与语言设置是否匹配（防止地理位置伪造）
	0,
	// 检测浏览器是否处于隐私/无痕模式
	1,
	// 检测开发者工具是否打开，以及 Firebug 等调试工具
	1,
	// 检测是否在应用内嵌的 WebView 中运行
	0,
	// 检测页面资源是否来自合法域名（bilibili相关域名），防止注入攻击
	0,
	// 检测更全面的自动化工具标识符，包括各种 WebDriver 相关属性
	0,
	// 综合检测多种异常情况：
	// 广告拦截器
	// Canvas 指纹一致性
	// 音频上下文异常
	// 字体检测
	// 脚本安全插件
	0,
	// 检测页面是否使用了 Angular、jQuery、React、Vue 等框架
	0,
	// 检测是否在微信、微博、QQ、支付宝等第三方应用中运行
	0,
	// 通过 eval 函数长度等特征验证浏览器类型真实性
	0,
	// 检测 navigator.languages 与 navigator.language 的一致性(不一致 OR 异常返回 1)
	0,
	// 检测操作系统信息的一致性
	0,
	// 检测屏幕可用尺寸与实际尺寸的比例异常
	0,
	// 检测 IndexedDB 支持
	1,
	// 是否允许使用cookie
	1,
	// 检测 localStorage 功能
	1,
	// 检测数据库支持（WebSQL 或 IndexedDB）
	1,
	// 检测 sessionStorage 功能
	1
];

/**
 * 生成安全信息
 */
export function genSecurityInfo(): string {
	return CHECK_MEASURES.join( "" );
}

/**
 * 需要 envInfo、publicKeyData、userId、securityInfo 四项使用 WebAssembly 进行加密
 * @param envInfo 环境指纹信息
 * @param publicKeyData RSA 密钥
 * @param userId UUID
 * @param securityInfo 安全信息
 */
export async function encryptData( envInfo: string, publicKeyData: string, userId: string, securityInfo?: string ): Promise<EncryptData> {
	securityInfo = securityInfo || genSecurityInfo();
	// TODO 待实现加密函数
	return {
		data: "",
		key: ""
	};
}