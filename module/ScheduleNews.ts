import { Job, scheduleJob } from "node-schedule";
import { randomInt } from "#genshin/utils/random";
import { DB_KEY } from "#hot-news/util/constants";
import { getHashField } from "#hot-news/util/RedisUtils";
import { getBiliDynamicNew, getBiliLive, getNews } from "#hot-news/util/api";
import { MessageType } from "@modules/message";
import { BOT } from "@modules/bot";
import puppeteer from "puppeteer";
import { ImgPttElem, segment } from "oicq";
import { renderer } from "#hot-news/init";
import {
	BiliDynamicCard,
	BiliDynamicMajorArchive,
	BiliDynamicMajorArticle,
	ChatInfo,
	DynamicInfo
} from "#hot-news/types/type";
import NewsConfig from "#hot-news/module/NewsConfig";
import { formatTimestamp } from "#hot-news/util/tools";

export class ScheduleNews {
	private readonly viewPort: puppeteer.Viewport;
	private readonly bot: BOT;
	private readonly config: NewsConfig;
	
	public constructor( bot: BOT, config: NewsConfig ) {
		this.viewPort = {
			width: 2000,
			height: 1000
		}
		this.bot = bot;
		this.config = config;
	}
	
	public createNewsSchedule(): void {
		scheduleJob( "hot-news", "0 30 8 * * *", async () => {
			const sec: number = randomInt( 0, 180 );
			const time = new Date().setSeconds( sec * 10 );
			
			const job: Job = scheduleJob( time, async () => {
				await this.notifyNews();
				job.cancel();
			} );
		} );
		this.bot.logger.info( "[hot-news]--每日热点新闻定时任务已创建完成..." );
	}
	
	public createBiliSchedule(): void {
		// B站动态定时轮询任务
		scheduleJob( "hot-news-bilibili-dynamic-job", this.config.biliDynamicScheduleRule, async () => {
			await this.notifyBiliDynamic();
		} );
		this.bot.logger.info( "[hot-news]--[bilibili-dynamic-job]--B站动态定时任务已创建完成..." );
		
		// B站直播定时轮询任务
		scheduleJob( "hot-news-bilibili-live-job", this.config.biliLiveScheduleRule, async () => {
			await this.notifyBiliLive();
		} );
		this.bot.logger.info( "[hot-news]--[bilibili-live-job]--B站直播定时任务已创建完成..." );
	}
	
	public async initBiliDynamic( uid: number ): Promise<void> {
		this.bot.logger.info( `[hot-news]--开始初始化B站[${ uid }]动态数据...` )
		const dynamic_list = await getBiliDynamicNew( uid, true );
		if ( dynamic_list.length > 0 ) {
			const ids: string[] = dynamic_list.map( d => d.id_str );
			await this.bot.redis.addSetMember( `${ DB_KEY.bili_dynamic_ids_key }.${ uid }`, ...ids );
		}
		this.bot.logger.info( `[hot-news]--初始化B站[${ uid }]动态数据完成.` );
	}
	
	public async initAllBiliDynamic(): Promise<void> {
		this.bot.logger.info( `[hot-news]开始初始化B站所有已订阅的UP主的动态数据...` )
		const allSubsIds: { [key: string]: string } = await this.bot.redis.getHash( DB_KEY.notify_bili_ids_key );
		const uidList: number[] = [];
		const uidStrList = Object.values( allSubsIds ) || [];
		for ( let value of uidStrList ) {
			const uids: number[] = JSON.parse( value );
			uidList.push( ...uids );
		}
		
		for ( let uid of uidList ) {
			await this.initBiliDynamic( uid );
		}
		this.bot.logger.info( `[hot-news]--初始化B站所有已订阅的UP主的动态数据完成` )
	}
	
	private async notifyNews(): Promise<void> {
		const set: string[] = await this.bot.redis.getSet( DB_KEY.ids );
		for ( let id of set ) {
			const { type, targetId }: ChatInfo = JSON.parse( id );
			
			const channel = await getHashField( DB_KEY.channel, `${ targetId }` );
			getNews( channel ).then( news => {
				this.sendMsg( type, targetId, news );
			} ).catch( reason => {
				this.bot.logger.error( reason )
			} )
		}
	}
	
	
	private async notifyBiliDynamic(): Promise<void> {
		const set = await this.bot.redis.getSet( DB_KEY.sub_bili_ids_key );
		for ( const sub of set ) {
			// 获取QQ号/QQ群号
			const chatInfo: ChatInfo = JSON.parse( sub );
			// 获取用户订阅的UP的uid
			const uidListStr = await getHashField( DB_KEY.notify_bili_ids_key, `${ chatInfo.targetId }` ) || "[]";
			const uidList: number[] = JSON.parse( uidListStr );
			
			// B站动态信息推送
			let cards: BiliDynamicCard[] = [];
			for ( let uid of uidList ) {
				const r = await getBiliDynamicNew( uid, false, this.config.biliDynamicApiCacheTime );
				if ( r.length > 0 ) {
					cards.push( ...r );
				}
			}
			const limit = await this.bot.redis.getString( `${ DB_KEY.limit_bili_dynamic_time_key }.${ chatInfo.targetId }` );
			// 默认消息24小时即为过期
			let limitMillisecond = 24 * 60 * 60 * 1000;
			if ( limit ) {
				limitMillisecond = parseInt( limit ) * 60 * 60 * 1000;
			}
			
			for ( let card of cards ) {
				const { name, mid: uid, pub_time, pub_ts } = card.modules.module_author;
				const {
					comment: { count: comment_num },
					like: { count: like_num },
					forward: { count: forward_num }
				} = card.modules.module_stat;
				const pub_tsm: number = pub_ts * 1000;
				const pub_tss: string = formatTimestamp( pub_tsm );
				// 判断动态是否已经过时
				if ( Date.now() - pub_tsm > limitMillisecond ) {
					this.bot.logger.info( `[hot-news]--[${ name }]-[${ pub_tss }]发布的动态[${ card.id_str }]已过时不再推送!` )
					// 把新的动态ID加入本地数据库
					await this.bot.redis.addSetMember( `${ DB_KEY.bili_dynamic_ids_key }.${ uid }`, card.id_str );
					continue;
				}
				
				// 专栏类型
				if ( card.type === 'DYNAMIC_TYPE_ARTICLE' ) {
					await this.articleHandle( card, chatInfo );
				} else if ( card.type === 'DYNAMIC_TYPE_LIVE_RCMD' ) {
					// 直播动态处理完后直接返回，不需要后续再查询
					this.bot.logger.info( `[hot-news]--获取到B站${ name }-[${ pub_tss }]发布的新动态[${ card.modules.module_dynamic.desc?.text || "直播推送" }]` );
					const notification_status = await this.bot.redis.getString( `${ DB_KEY.bili_live_notified }.${ chatInfo.targetId }.${ uid }` );
					if ( !notification_status ) {
						const dynamicInfo: DynamicInfo = {
							id: card.id_str,
							name,
							uid,
							pub_time,
							pub_tss,
							like_num,
							comment_num,
							forward_num
						};
						await this.normalDynamicHandle( dynamicInfo, chatInfo );
					} else {
						this.bot.logger.info( `[hot-news]--[${ name }]的直播开播消息已推送过了，该直播动态不再推送！` )
					}
					await this.bot.redis.setString( `${ DB_KEY.bili_live_notified }.${ chatInfo.targetId }.${ uid }`, "1", this.config.biliLiveCacheTime * 60 * 60 );
				} else if ( card.type === "DYNAMIC_TYPE_AV" ) {
					this.bot.logger.info( `[hot-news]--获取到B站[${ name }]-[${ pub_tss }]发布的新动态[${ card.modules.module_dynamic.desc?.text || "投稿视频" }]` );
					const { archive } = <BiliDynamicMajorArchive>card.modules.module_dynamic.major;
					const dynamicInfo: DynamicInfo = {
						id: card.id_str,
						name,
						uid,
						pub_time,
						pub_tss,
						like_num,
						comment_num,
						forward_num,
						archive
					};
					await this.normalDynamicHandle( dynamicInfo, chatInfo );
				} else {
					this.bot.logger.info( `[hot-news]--获取到B站[${ name }]-[${ pub_tss }]发布的新动态[${ card.modules.module_dynamic.desc?.text }]` );
					const dynamicInfo: DynamicInfo = {
						id: card.id_str,
						name,
						uid,
						pub_time,
						pub_tss,
						like_num,
						comment_num,
						forward_num
					};
					await this.normalDynamicHandle( dynamicInfo, chatInfo );
				}
				
				// 把新的动态ID加入本地数据库
				await this.bot.redis.addSetMember( `${ DB_KEY.bili_dynamic_ids_key }.${ uid }`, card.id_str );
			}
		}
	}
	
	private async notifyBiliLive(): Promise<void> {
		const set = await this.bot.redis.getSet( DB_KEY.sub_bili_ids_key );
		for ( const sub of set ) {
			// 获取QQ号/QQ群号
			const chatInfo: ChatInfo = JSON.parse( sub );
			// 获取用户订阅的UP的uid
			const uidListStr = await getHashField( DB_KEY.notify_bili_ids_key, `${ chatInfo.targetId }` ) || "[]";
			const uidList: number[] = JSON.parse( uidListStr );
			
			// B站直播推送
			for ( let uid of uidList ) {
				const notification_status = await this.bot.redis.getString( `${ DB_KEY.bili_live_notified }.${ chatInfo.targetId }.${ uid }` );
				if ( !notification_status ) {
					const live = await getBiliLive( uid, false, this.config.biliLiveApiCacheTime );
					if ( live && live.liveRoom && live.liveRoom.liveStatus === 1 ) {
						// noinspection JSUnusedLocalSymbols
						const {
							name,
							liveRoom: { title, url, cover, watched_show: { num, text_large, text_small } }
						} = live;
						const cacheTime: number = this.config.biliLiveCacheTime * 60 * 60;
						const image: ImgPttElem = segment.image( cover, true, 5000 );
						// noinspection JSUnusedLocalSymbols
						const img: string = segment.toCqcode( image );
						let msg = eval( this.config.liveTemplate );
						await this.sendMsg( chatInfo.type, chatInfo.targetId, msg );
						await this.bot.redis.setString( `${ DB_KEY.bili_live_notified }.${ chatInfo.targetId }.${ uid }`, "1", cacheTime );
					}
				}
			}
		}
	}
	
	private async articleHandle( card: BiliDynamicCard, { type, targetId }: ChatInfo ): Promise<void> {
		// noinspection JSUnusedLocalSymbols
		const {
			article: {
				covers,
				desc,
				title,
				jump_url,
				label
			}
		} = <BiliDynamicMajorArticle>card.modules.module_dynamic.major;
		// noinspection JSUnusedLocalSymbols
		const cover_list = covers.map( ( l: string ) => {
			const image: ImgPttElem = segment.image( l, true, 5000 );
			return segment.toCqcode( image );
		} );
		// noinspection JSUnusedLocalSymbols
		const { name, mid: uid, pub_time, pub_ts } = card.modules.module_author;
		// noinspection JSUnusedLocalSymbols
		const id = card.id_str;
		// noinspection JSUnusedLocalSymbols
		const {
			comment: { count: comment_num },
			like: { count: like_num },
			forward: { count: forward_num }
		} = card.modules.module_stat;
		const pub_tsm: number = pub_ts * 1000;
		const pub_tss: string = formatTimestamp( pub_tsm );
		this.bot.logger.info( `[hot-news]--获取到B站-[${ pub_tss }]发布的${ name }新动态[${ desc }]` );
		const url = `https:${ jump_url }`;
		let msg = eval( this.config.articleDynamicTemplate );
		await this.sendMsg( type, targetId, msg );
		
		// 检测是否图片消息是否已经缓存
		let imgMsg: string = await this.bot.redis.getString( `${ DB_KEY.img_msg_key }.${ card.id_str }` );
		if ( imgMsg ) {
			this.bot.logger.info( `[hot-news]--检测到动态[${ card.id_str }]渲染图的缓存，不再渲染新图，直接使用缓存内容.` )
			await this.sendMsg( type, targetId, imgMsg );
			return;
		}
		
		// 图可能比较大，单独再发送一张图
		const res = await renderer.asForFunction( url, ScheduleNews.articleDynamicPageFunction, this.viewPort );
		if ( res.code === 'ok' ) {
			imgMsg = ScheduleNews.asCqCode( res.data );
			await this.bot.redis.setString( `${ DB_KEY.img_msg_key }.${ card.id_str }`, imgMsg, this.config.biliScreenshotCacheTime );
		} else {
			this.bot.logger.error( res.error );
			imgMsg = eval( this.config.errorMsgTemplate );
		}
		await this.sendMsg( type, targetId, imgMsg );
	}
	
	private async sendMsg( type: number, targetId: number, msg: string ) {
		if ( type === MessageType.Private ) {
			const sendMessage = this.bot.message.getSendMessageFunc( targetId, MessageType.Private );
			await sendMessage( msg );
		} else {
			const sendMessage = this.bot.message.getSendMessageFunc( -1, MessageType.Group, targetId );
			await sendMessage( msg, false );
		}
	}
	
	// noinspection JSUnusedLocalSymbols
	private async normalDynamicHandle( {
		                                   id,
		                                   name,
		                                   uid,
		                                   pub_time,
		                                   pub_tss,
		                                   like_num,
		                                   comment_num,
		                                   forward_num,
		                                   archive
	                                   }: DynamicInfo, {
		                                   type,
		                                   targetId
	                                   }: ChatInfo ): Promise<void> {
		// 检测是否图片消息是否已经缓存
		let msg: string = await this.bot.redis.getString( `${ DB_KEY.img_msg_key }.${ id }` );
		if ( msg ) {
			this.bot.logger.info( `[hot-news]--检测到动态[${ id }]渲染图的缓存，不再渲染新图，直接使用缓存内容.` )
			await this.sendMsg( type, targetId, msg );
			return;
		}
		
		const url = `https://t.bilibili.com/${ id }`;
		const res = await renderer.asForFunction( url, ScheduleNews.normalDynamicPageFunction, this.viewPort );
		if ( res.code === 'ok' ) {
			// noinspection JSUnusedLocalSymbols
			const img = ScheduleNews.asCqCode( res.data );
			// 如果是视频投稿，那么把cover设置为它对应的cqcode
			if ( archive ) {
				const image: ImgPttElem = segment.image( archive.cover, true, 5000 );
				archive.cover = segment.toCqcode( image );
				msg = eval( this.config.videoDynamicTemplate );
			} else {
				msg = eval( this.config.dynamicTemplate );
			}
			await this.bot.redis.setString( `${ DB_KEY.img_msg_key }.${ id }`, msg, this.config.biliScreenshotCacheTime );
		} else {
			this.bot.logger.error( res.error );
			msg = eval( this.config.errorMsgTemplate );
		}
		await this.sendMsg( type, targetId, msg );
	}
	
	private static asCqCode( base64Str: string ): string {
		const base64: string = `base64://${ base64Str }`;
		return `[CQ:image,file=${ base64 }]`;
	}
	
	private static async normalDynamicPageFunction( page: puppeteer.Page ): Promise<Buffer | string | void> {
		// 把头部信息以及可能出现的未登录弹框删掉
		await page.$eval( "#internationalHeader", element => element.remove() );
		let card = await page.waitForSelector( ".card" );
		let clip = await card?.boundingBox();
		let bar = await page.waitForSelector( ".text-bar" )
		let bar_bound = await bar?.boundingBox();
		clip!.height = bar_bound!.y - clip!.y;
		return await page.screenshot( {
			clip: { x: clip!.x, y: clip!.y, width: clip!.width, height: clip!.height },
			encoding: "base64"
		} );
	}
	
	private static async articleDynamicPageFunction( page: puppeteer.Page ): Promise<Buffer | string | void> {
		await page.$eval( "#internationalHeader", element => element.remove() );
		const option: puppeteer.ScreenshotOptions = { encoding: "base64" };
		const element = await page.$( ".article-container__content" );
		if ( element ) {
			return await element.screenshot( option );
		}
		throw '渲染图片出错，未找到DOM节点';
	}
}