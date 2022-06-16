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
	/** 推送B站动态时是否发送该动态的访问链接 */
	public isSendUrl: boolean;
	
	public static init = {
		maxSubscribeNum: 5,
		biliDynamicScheduleRule: "0 0/3 * * * *",
		biliLiveScheduleRule: "0 0/3 * * * *",
		biliDynamicApiCacheTime: 175,
		biliLiveApiCacheTime: 175,
		biliScreenshotCacheTime: 60,
		biliLiveCacheTime: 8,
		isSendUrl: false
	};
	
	constructor( config: any ) {
		this.maxSubscribeNum = config.maxSubscribeNum;
		this.biliDynamicScheduleRule = config.biliDynamicScheduleRule;
		this.biliLiveScheduleRule = config.biliLiveScheduleRule;
		this.biliDynamicApiCacheTime = config.biliDynamicApiCacheTime;
		this.biliLiveApiCacheTime = config.biliLiveApiCacheTime;
		this.biliScreenshotCacheTime = config.biliScreenshotCacheTime;
		this.biliLiveCacheTime = config.biliLiveCacheTime;
		this.isSendUrl = config.isSendUrl;
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
			this.isSendUrl = config.isSendUrl;
			return "hot_news.yml 重新加载完毕";
		} catch ( error ) {
			throw <RefreshCatch>{
				log: ( <Error>error ).stack,
				msg: "hot_news.yml 重新加载失败，请前往控制台查看日志"
			};
		}
	}
}