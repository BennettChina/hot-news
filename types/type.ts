import { MessageType } from "@modules/message";

/**
 * @interface
 * bilibili动态信息
 * @basic
 */
export interface BiliDynamicCard {
	basic: BiliDynamicBasicInfo;
	id_str: string;
	modules: {
		module_author: BiliDynamicModuleAuthor;
		module_dynamic: BiliDynamicModuleDynamic;
		module_tag: { text: string };
	};
	type: BiliDynamicType;
	visible: boolean;
}

/**
 * @interface
 * 动态的基本信息
 */
interface BiliDynamicBasicInfo {
	comment_id_str: string;
	comment_type: number;
	rid_str: string; // 专栏类型动态时使用该ID访问
}

/**
 * @interface
 * 动态的发布者信息
 */
interface BiliDynamicModuleAuthor {
	mid: number; // 发布者的uid
	face: string; // 头像
	name: string; // 昵称
	jump_url: string; // 动态地址，无协议头
	pub_action: string;
	pub_time: string;
	pub_ts: number; // 发布的时间戳（秒级）
	type: "AUTHOR_TYPE_NORMAL" | string;
}

interface BiliDynamicModuleDynamic {
	additional: {};
	desc?: {
		rich_text_nodes: any[]; // 动态文本中的@消息、话题tag、互动抽奖
		text: string; // 动态的文本内容
	}; // 专栏类型时该属性为空
	major?: BiliDynamicMajor; // 纯文本类型、转发动态类型时该属性为空
	topic?: string; // 截止2022-05-22一直是空的
}

export type BiliDynamicMajor =
	BiliDynamicMajorArchive
	| BiliDynamicMajorArticle
	| BiliDynamicMajorDraw
	| BiliDynamicMajorLive;

/**
 * @type BiliDynamicType bilibili动态类型
 */
type BiliDynamicType =
// 专栏类型
	"DYNAMIC_TYPE_ARTICLE"
	// 投稿视频类型
	| "DYNAMIC_TYPE_AV"
	// 文字+图片类型
	| "DYNAMIC_TYPE_DRAW"
	// 转发动态
	| "DYNAMIC_TYPE_FORWARD"
	// 直播推送动态
	| "DYNAMIC_TYPE_LIVE_RCMD"
	// 纯文字动态
	| "DYNAMIC_TYPE_WORD"
	| string;
type BiliDynamicMajorType =
	"MAJOR_TYPE_ARCHIVE"
	| "MAJOR_TYPE_ARTICLE"
	| "MAJOR_TYPE_DRAW"
	| "MAJOR_TYPE_LIVE_RCMD"
	| string;

/**
 * @interface
 * 视频投稿内容
 */
export interface BiliDynamicMajorArchive {
	type: BiliDynamicMajorType;
	archive: {
		aid: string;
		badge: {
			bg_color: string;
			color: string;
			text: string
		};
		bvid: string;
		cover: string;
		desc: string;
		disable_preview: boolean;
		duration_text: string;
		jump_url: string;
		stat: {
			danmaku: string;
			play: string
		};
		title: string;
		type: number;
	}
}

/**
 * @interface
 * 专栏类型内容
 */
export interface BiliDynamicMajorArticle {
	type: BiliDynamicMajorType;
	article: {
		covers: string[]; // 专栏的封面
		desc: string; // 专栏内容
		id: number; // 专栏ID
		jump_url: string; // 专栏地址，无协议头
		label: string;
		title: string; // 专栏的标题
	}
}

/**
 * @interface
 * 文字+图片类型内容
 */
export interface BiliDynamicMajorDraw {
	type: BiliDynamicMajorType;
	draw: {
		id: number;
		items: {
			height: number;
			size: number;
			src: string;
			tags: any[];
			width: number;
		}[];
	};
}

/**
 * @interface
 * 直播推送类型内容
 */
export interface BiliDynamicMajorLive {
	type: BiliDynamicMajorType;
	live_rcmd: {
		content: string;
		reserve_type: number;
	};
}


/**
 *@interface
 * bilibili直播间信息
 * @liveRoom 直播间信息
 * @liveStatus 直播状态
 * @roomStatus 房间状态
 * @title 直播标题
 * @url 直播间地址
 * @cover 直播封面
 * @name: up主名称
 */
export interface BiliLiveInfo {
	liveRoom: {
		liveStatus: number;
		roomStatus: number;
		title: string;
		url: string;
		cover: string;
	};
	name: string;
}

/**
 * @interface
 * 网站信息
 * @cn 新闻网站中文名称
 * @logo 新闻网站LOGO
 * @url 新闻网站地址
 * @iter
 */
interface News_Attrs {
	cn: string;
	logo: string;
	url: string;
	iter: number;
}

/**
 * @interface
 * 新闻信息
 * @iid 新闻ID
 * @title 新闻标题
 * @more 热度
 * @add_date 创建时间
 * @new_tag TAG
 */
interface News_Item {
	iid: number;
	title: string;
	more: string;
	add_date: number;
	new_tag: boolean;
}

/**
 * @interface
 * @items 新闻条目
 * @attrs 属性
 */
interface News_Sub {
	items: News_Item[];
	attrs: {
		cn: string;
		display: number;
	}
}

export interface News {
	site: {
		attrs: News_Attrs;
		subs: News_Sub[];
	}
}

/**
 * @interface
 * 聊天来源信息
 * @targetId 群号｜QQ号
 * @user_id QQ号
 * @type: 群聊｜私聊｜未知
 */
export interface ChatInfo {
	targetId: number;
	user_id: number;
	type: MessageType;
}