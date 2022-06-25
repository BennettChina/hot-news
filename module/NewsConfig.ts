import { RefreshCatch } from "@modules/management/refresh";

export default class NewsConfig {
	/** 用户的最大订阅数量 */
	public maxSubscribeNum: number;
	/** B站动态查询定时任务规则 */
	public biliDynamicScheduleRule: string;
	/** B站直播查询定时任务规则 */
	public biliLiveScheduleRule: string;
	/** B站动态API信息缓存时间（秒），该时间必须小于动态的轮询间隔时间 */
	public biliDynamicApiCacheTime: number;
	/** B站直播API信息缓存时间（秒），该时间必须小于动态的轮询间隔时间 */
	public biliLiveApiCacheTime: number;
	/** B站动态截图缓存时间（秒），该时间必须小于动态的轮询间隔时间 */
	public biliScreenshotCacheTime: number;
	/** B站直播状态缓存时间（小时），在此时间内不会再次推送该直播间 */
	public biliLiveCacheTime: number;
	/** B站直播推送的模版消息 */
	public liveTemplate: string;
	/** B站常规动态推送的模版消息 */
	public dynamicTemplate: string;
	/** B站专栏动态推送的模版消息 */
	public articleDynamicTemplate: string;
	/** B站视频动态推送的模版消息 */
	public videoDynamicTemplate: string;
	/** B站动态截图渲染失败的模版消息 */
	public errorMsgTemplate: string;
	
	public static init = {
		maxSubscribeNum: 5,
		biliDynamicScheduleRule: "0 0/3 * * * *",
		biliLiveScheduleRule: "0 0/3 * * * *",
		biliDynamicApiCacheTime: 175,
		biliLiveApiCacheTime: 175,
		biliScreenshotCacheTime: 60,
		biliLiveCacheTime: 8,
		liveTemplate: "`[B站] ${up_name}开播啦!\\n标题：${title}\\n直播间：${url}\\n${img}`",
		dynamicTemplate: "`[B站] ${name}发布新动态了!\\n动态地址：${url}\\n${img}`",
		articleDynamicTemplate: "`[B站] ${name}发布新动态了!\\n动态地址：${url}\\n ${desc}`",
		videoDynamicTemplate: "`[B站] ${name}发布新的投稿视频了!\\n标题：${archive.title}\\简介：${archive.desc}\\n视频地址：${archive.jump_url}\\n${img}`",
		errorMsgTemplate: "`(＞﹏＜)[图片渲染出错了，请自行前往B站查看最新动态。]`",
	};
	
	constructor( config: any ) {
		this.maxSubscribeNum = config.maxSubscribeNum;
		this.biliDynamicScheduleRule = config.biliDynamicScheduleRule;
		this.biliLiveScheduleRule = config.biliLiveScheduleRule;
		this.biliDynamicApiCacheTime = config.biliDynamicApiCacheTime;
		this.biliLiveApiCacheTime = config.biliLiveApiCacheTime;
		this.biliScreenshotCacheTime = config.biliScreenshotCacheTime;
		this.biliLiveCacheTime = config.biliLiveCacheTime;
		this.liveTemplate = config.liveTemplate;
		this.dynamicTemplate = config.dynamicTemplate;
		this.articleDynamicTemplate = config.articleDynamicTemplate;
		this.videoDynamicTemplate = config.videoDynamicTemplate;
		this.errorMsgTemplate = config.errorMsgTemplate;
	}
	
	public async refresh( config ): Promise<string> {
		try {
			this.maxSubscribeNum = config.maxSubscribeNum;
			this.biliDynamicScheduleRule = config.biliDynamicTime;
			this.biliLiveScheduleRule = config.biliLiveScheduleRule;
			this.biliDynamicApiCacheTime = config.biliDynamicApiCacheTime;
			this.biliLiveApiCacheTime = config.biliLiveApiCacheTime;
			this.biliScreenshotCacheTime = config.biliScreenshotCacheTime;
			this.biliLiveCacheTime = config.biliLiveCacheTime;
			this.liveTemplate = config.liveTemplate;
			this.dynamicTemplate = config.dynamicTemplate;
			this.articleDynamicTemplate = config.articleDynamicTemplate;
			this.videoDynamicTemplate = config.videoDynamicTemplate;
			this.errorMsgTemplate = config.errorMsgTemplate;
			return "hot_news.yml 重新加载完毕";
		} catch ( error ) {
			throw <RefreshCatch>{
				log: ( <Error>error ).stack,
				msg: "hot_news.yml 重新加载失败，请前往控制台查看日志"
			};
		}
	}
}