import { MessageType } from "@modules/message";
import { ImageElem } from "icqq";

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
		module_stat: {
			comment: Comment;
			forward: Forward;
			like: Like;
		};
	};
	type: BiliDynamicType;
	visible: boolean;
}

/**
 * 转发动态类型
 */
export interface BiliDynamicForwardCard extends BiliDynamicCard {
	type: "DYNAMIC_TYPE_FORWARD";
	orig: BiliDynamicCard;
}

interface Comment {
	count: number;
	forbidden: boolean;
	hidden: boolean;
}

interface Forward {
	count: number;
	forbidden: boolean;
}

interface Like {
	count: number;
	forbidden: boolean;
	status: boolean;
}

/**
 * @interface
 * 动态的基本信息
 */
interface BiliDynamicBasicInfo {
	comment_id_str: string;
	comment_type: number;
	jump_url: string;// 不带协议头
	like_icon: object;
	rid_str: string; // 专栏类型动态时使用该ID访问
}

export interface Container_size {
	height: number;
	width: number;
}

export interface Pos_spec {
	axis_x: number;
	axis_y: number;
	coordinate_pos: number;
}

export interface Render_spec {
	opacity: number;
}

export interface Size_spec {
	height: number;
	width: number;
}

export interface General_spec {
	pos_spec: Pos_spec;
	render_spec: Render_spec;
	size_spec: Size_spec;
}

export interface GENERAL_CFG {
	config_type: number;
	general_config: {
		web_css_style: object;
	}
}

type Tag = AvatarTag | PendantTag | IconTag;

interface AvatarTag {
	AVATAR_LAYER: object;
	GENERAL_CFG: GENERAL_CFG;
}

interface PendantTag {
	PENDENT_LAYER: object;
	GENERAL_CFG: GENERAL_CFG;
}

interface IconTag {
	ICON_LAYER: object;
	GENERAL_CFG: GENERAL_CFG;
}


export interface Layer_config {
	is_critical: boolean;
	tags: Tag;
}

export interface Remote {
	bfs_style: string;
	url: string;
}

export interface Image_src {
	placeholder: number;
	remote: Remote;
	src_type: number;
}

export interface Res_image {
	image_src: Image_src;
}

export interface Resource {
	res_image: Res_image;
	res_type: number;
}

export interface CommonLayer {
	general_spec: General_spec;
	layer_config: Layer_config;
	resource: Resource;
	visible: boolean;
}

export interface Fallback_layer {
	is_critical_group: boolean;
	layers: CommonLayer[];
}

export interface Layer {
	is_critical_group: boolean;
	layers: CommonLayer[];
}

export interface Avatar {
	container_size: Container_size;
	fallback_layers: Fallback_layer;
	layers: Layer[];
	mid: string;
}

export interface Fan {
	color: string;
	is_fan: boolean;
	num_str: string;
	number: number;
}

export interface Decorate {
	card_url: string;
	fan: Fan;
	id: number;
	jump_url: string;
	name: string;
	type: number;
}

export interface OfficialVerify {
	desc: string;
	type: number;
}

export interface Pendant {
	expire: number;
	image: string;
	image_enhance: string;
	image_enhance_frame: string;
	name: string;
	pid: number;
}

export interface Label {
	bg_color: string;
	bg_style: number;
	border_color: string;
	img_label_uri_hans: string;
	img_label_uri_hans_static: string;
	img_label_uri_hant: string;
	img_label_uri_hant_static: string;
	label_theme: string;
	path: string;
	text: string;
	text_color: string;
	use_img_label: boolean;
}

export interface Vip {
	avatar_subscript: number;
	avatar_subscript_url: string;
	due_date: number;
	label: Label;
	nickname_color: string;
	status: number;
	theme_type: number;
	type: number;
}

/**
 * @interface
 * 动态的发布者信息
 */
interface BiliDynamicModuleAuthor {
	avatar: Avatar;
	decorate: Decorate;
	face_nft: boolean;
	following: boolean;
	label: string;
	official_verify: OfficialVerify;
	pendant: Pendant;
	pub_location_text: string;
	vip: Vip;
	mid: number; // 发布者的uid
	face: string; // 头像
	name: string; // 昵称
	jump_url: string; // 动态地址，无协议头
	pub_action: string;
	pub_time: string;
	pub_ts: number; // 发布的时间戳（秒级）
	type: "AUTHOR_TYPE_NORMAL" | string;
}

type RichTextNodeType =
	"RICH_TEXT_NODE_TYPE_NONE"
	// 文字节点
	| "RICH_TEXT_NODE_TYPE_TEXT"
	// @用户
	| "RICH_TEXT_NODE_TYPE_AT"
	// 互动抽奖
	| "RICH_TEXT_NODE_TYPE_LOTTERY"
	// 投票
	| "RICH_TEXT_NODE_TYPE_VOTE"
	// 话题
	| "RICH_TEXT_NODE_TYPE_TOPIC"
	// 商品
	| "RICH_TEXT_NODE_TYPE_GOODS"
	// 视频链接
	| "RICH_TEXT_NODE_TYPE_BV"
	| "RICH_TEXT_NODE_TYPE_AV"
	// 表情
	| "RICH_TEXT_NODE_TYPE_EMOJI"
	| "RICH_TEXT_NODE_TYPE_USER"
	| "RICH_TEXT_NODE_TYPE_CV"
	| "RICH_TEXT_NODE_TYPE_VC"
	// 网页链接
	| "RICH_TEXT_NODE_TYPE_WEB"
	| "RICH_TEXT_NODE_TYPE_TAOBAO"
	// 邮箱地址
	| "RICH_TEXT_NODE_TYPE_MAIL"
	// 剧集信息
	| "RICH_TEXT_NODE_TYPE_OGV_SEASON"
	| "RICH_TEXT_NODE_TYPE_OGV_EP"
	| "RICH_TEXT_NODE_TYPE_SEARCH_WORD"

type RichTextNode = RichTextNodeTopic | RichTextNodeText;

interface RichTextNodeTopic {
	jump_url: string;
	orig_text: string;
	text: string;
	type: "RICH_TEXT_NODE_TYPE_TOPIC";
}

interface RichTextNodeText {
	orig_text: string;
	text: string;
	type: "RICH_TEXT_NODE_TYPE_TEXT";
}

interface BiliDynamicModuleDynamic {
	additional: object;
	desc?: {
		rich_text_nodes: RichTextNode[]; // 动态文本中的@消息、话题tag、互动抽奖
		text: string; // 动态的文本内容
	}; // 专栏类型时该属性为空
	major?: BiliDynamicMajor; // 纯文本类型、转发动态类型时该属性为空
	topic?: string; // 截止2022-05-22一直是空的
}

export interface BiliDynamicMajorOpus {
	type: "MAJOR_TYPE_OPUS";
	opus: {
		fold_action: string[];
		jump_url: string;
		pics: string[];
		summary: Summary;
		title: string;
	}
}

interface Summary {
	rich_text_nodes: RichTextNodeText[];
	text: string;
}

export type BiliDynamicMajor =
	BiliDynamicMajorArchive
	| BiliDynamicMajorArticle
	| BiliDynamicMajorDraw
	| BiliDynamicMajorLive
	| BiliDynamicMajorOpus;

/**
 * @type BiliDynamicType bilibili动态类型
 */
export type BiliDynamicType =
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
	// 直播间分享
	| "DYNAMIC_TYPE_LIVE"
	// 纯文字动态
	| "DYNAMIC_TYPE_WORD"
	// 剧集（番剧、电影、纪录片）
	| "DYNAMIC_TYPE_PGC"
	| "DYNAMIC_TYPE_COURSES"
	// 音乐
	| "DYNAMIC_TYPE_MUSIC"
	// 装扮
	| "DYNAMIC_TYPE_COMMON_SQUARE"
	| "DYNAMIC_TYPE_COMMON_VERTICAL"
	// 收藏夹
	| "DYNAMIC_TYPE_MEDIALIST"
	// 课程
	| "DYNAMIC_TYPE_COURSES_SEASON"
	| "DYNAMIC_TYPE_COURSES_BATCH"
	| "DYNAMIC_TYPE_AD"
	| "DYNAMIC_TYPE_APPLET"
	| "DYNAMIC_TYPE_SUBSCRIPTION"
	| "DYNAMIC_TYPE_BANNER"
	// 合集更新
	| "DYNAMIC_TYPE_UGC_SEASON"
	| "DYNAMIC_TYPE_SUBSCRIPTION_NEW"
	// 无效动态
	| "DYNAMIC_TYPE_NONE"
	| string;

/**
 * @interface
 * 视频投稿内容
 */
export interface BiliDynamicMajorArchive {
	type: "MAJOR_TYPE_ARCHIVE";
	archive: BiliDynamicMajorArchiveInfo
}

export interface BiliDynamicMajorArchiveInfo {
	aid: string;
	badge: {
		bg_color: string;
		color: string;
		text: string
	};
	bvid: string;
	cover: string | ImageElem;
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

/**
 * @interface
 * 专栏类型内容
 */
export interface BiliDynamicMajorArticle {
	type: "MAJOR_TYPE_ARTICLE";
	article: {
		covers: string[]; // 专栏的封面
		desc: string; // 专栏内容
		id: number; // 专栏ID
		jump_url: string; // 专栏地址，无协议头
		label: string;
		title: string; // 专栏的标题
	}
}

interface DrawItem {
	height: number;
	size: number;
	src: string;
	tags: any[];
	width: number;
}

/**
 * @interface
 * 文字+图片类型内容
 */
export interface BiliDynamicMajorDraw {
	type: "MAJOR_TYPE_DRAW";
	draw: {
		id: number;
		items: DrawItem[];
	};
}

/**
 * @interface
 * 直播推送类型内容
 */
export interface BiliDynamicMajorLive {
	type: "MAJOR_TYPE_LIVE_RCMD";
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
		// 0: 未开播，1: 正在直播，2: 轮播中
		liveStatus: number;
		roomStatus: number;
		title: string;
		url: string;
		cover: string;
		// 直播开始的时间戳（秒）
		live_time: number;
		watched_show: {
			switch: boolean;
			num: number;// 直播间人气值
			text_small: string; // 人气值字符串
			text_large: string; // 带描述的人气值字符串，示例：100人气
		},
		room_id: number;
		short_id: number;
		area_name: string;
		area_v2_name: string;
		area_v2_parent_name: string;
		tag_name: string
		face: string;
	} | null;
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

/**
 * @interface DynamicInfo
 * 动态信息
 * @id 动态ID
 * @name: UP的名称
 * @uid UP的UID
 * @pub_time 发布时间(示例: 06-24、昨天)
 * @pub_tss 动态发布的具体时间
 * @comment_num 评论数量
 * @forward_num 转发数量
 * @like_num 点赞数量
 */
export interface DynamicInfo {
	id: string;
	name: string;
	uid: number;
	pub_time: string;
	pub_tss: string;
	comment_num: number;
	forward_num: number;
	like_num: number;
	archive?: BiliDynamicMajorArchiveInfo;
}

export interface LiveUserInfo {
	follower_num: number;
	level: number;
	official_type: number;
	color: number;
	uname: string;
}

export interface UpCardInfo {
	follower: number;
	article_count: number;
	vip_status: number;
}
