import { Job, scheduleJob } from "node-schedule";
import { randomInt } from "#genshin/utils/random";
import { DB_KEY } from "#hot-news/util/constants";
import { getHashField } from "#hot-news/util/RedisUtils";
import { getBiliDynamicNew, getBiliLive, getNews } from "#hot-news/util/api";
import { MessageType } from "@modules/message";
import { BOT } from "@modules/bot";
import puppeteer from "puppeteer";
import { segment } from "oicq";
import { renderer } from "#hot-news/init";
import { BiliDynamicCard, BiliDynamicMajorArticle, ChatInfo } from "#hot-news/types/type";

export class ScheduleNews {
	private readonly viewPort: puppeteer.Viewport;
	private readonly bot: BOT;
	
	public constructor( bot: BOT ) {
		this.viewPort = {
			width: 2000,
			height: 1000
		}
		this.bot = bot;
	}
	
	public createNewsSchedule(): void {
		scheduleJob( "0 30 8 * * *", async () => {
			const sec: number = randomInt( 0, 180 );
			const time = new Date().setSeconds( sec * 10 );
			
			const job: Job = scheduleJob( time, async () => {
				await this.notifyNews();
				job.cancel();
			} );
		} );
	}
	
	public createGenshinSchedule(): void {
		scheduleJob( "0 0/3 * * * *", async () => {
			await this.notifyGenshin();
		} )
	}
	
	public async initGenshinDynamic(): Promise<void> {
		this.bot.logger.info( "[hot-news]开始初始化B站原神动态数据..." )
		const dynamic_list = await getBiliDynamicNew();
		if ( dynamic_list ) {
			const ids: string[] = dynamic_list.map( d => d.id_str );
			await this.bot.redis.addSetMember( DB_KEY.genshin_dynamic_ids_key, ...ids );
			this.bot.logger.info( "[hot-news]初始化B站原神动态数据完成." );
		}
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
	
	
	private async notifyGenshin(): Promise<void> {
		const set = await this.bot.redis.getSet( DB_KEY.genshin_ids );
		const ids = await this.bot.redis.getSet( DB_KEY.genshin_dynamic_ids_key );
		for ( const sub of set ) {
			const chatInfo: ChatInfo = JSON.parse( sub );
			// B站动态信息推送
			const r = await getBiliDynamicNew();
			let liveDynamic: boolean = false;
			const notification_status = await this.bot.redis.getString( `${ DB_KEY.genshin_live_notified }.${ chatInfo.targetId }` );
			const limit = await this.bot.redis.getString( `${ DB_KEY.limit_genshin_dynamic_time_key }.${ chatInfo.targetId }` );
			let limitMillisecond = 0;
			if ( limit ) {
				limitMillisecond = parseInt( limit ) * 60 * 60 * 1000;
			}
			if ( r && r.length > 0 ) {
				for ( let card of r ) {
					if ( ids.includes( card.id_str ) ) {
						this.bot.logger.debug( `[hot-news]历史动态[${ card.id_str }]，跳过推送!` );
						continue;
					}
					
					// 判断动态是否已经过时
					if ( limit && ( Date.now() - card.modules.module_author.pub_ts * 1000 > limitMillisecond ) ) {
						this.bot.logger.info( `[hot-news]动态[${ card.id_str }]已过时不再推送!` )
						// 把新的动态ID加入本地数据库
						await this.bot.redis.addSetMember( DB_KEY.genshin_dynamic_ids_key, card.id_str );
						continue;
					}
					
					// 专栏类型
					if ( card.type === 'DYNAMIC_TYPE_ARTICLE' ) {
						await this.articleHandle( card, chatInfo );
					} else if ( card.type === 'DYNAMIC_TYPE_LIVE_RCMD' ) {
						// 直播动态处理完后直接返回，不需要后续再查询
						this.bot.logger.info( `[hot-news]获取到B站原神新动态[${ card.modules.module_dynamic.desc?.text }]` );
						if ( !notification_status ) {
							await this.normalDynamicHandle( card.id_str, chatInfo );
						} else {
							this.bot.logger.info( "[hot-news]直播开播消息已推送过了，该直播动态不再推送！" )
						}
						await this.bot.redis.setString( `${ DB_KEY.genshin_live_notified }.${ chatInfo.targetId }`, "1", 8 * 60 * 60 );
						liveDynamic = true;
					} else {
						this.bot.logger.info( `[hot-news]获取到B站原神新动态[${ card.modules.module_dynamic.desc?.text }]` );
						await this.normalDynamicHandle( card.id_str, chatInfo );
					}
					
					// 把新的动态ID加入本地数据库
					await this.bot.redis.addSetMember( DB_KEY.genshin_dynamic_ids_key, card.id_str );
				}
			}
			
			// B站直播推送
			if ( !liveDynamic && !notification_status ) {
				const live = await getBiliLive();
				if ( live.liveRoom.liveStatus === 1 ) {
					const image = segment.image( live.liveRoom.cover, true, 10000 );
					const cqCode = segment.toCqcode( image );
					let msg = `B站${ live.name }开播啦!\n标题：${ live.liveRoom.title }\n直播间：${ live.liveRoom.url }\n${ cqCode }`
					await this.sendMsg( chatInfo.type, chatInfo.targetId, msg );
					await this.bot.redis.setString( `${ DB_KEY.genshin_live_notified }.${ chatInfo.targetId }`, "1", 8 * 60 * 60 );
				}
			}
		}
	}
	
	private async articleHandle( card: BiliDynamicCard, { type, targetId }: ChatInfo ): Promise<void> {
		const { article } = <BiliDynamicMajorArticle>card.modules.module_dynamic.major;
		this.bot.logger.info( `[hot-news]获取到B站原神新动态[${ article.desc }]` );
		let msg = `B站原神发布新动态了!\n ${ article.desc }`;
		await this.sendMsg( type, targetId, msg );
		
		// 检测是否图片消息是否已经缓存
		let imgMsg: string = await this.bot.redis.getString( `${ DB_KEY.img_msg_key }.${ card.id_str }` );
		if ( imgMsg ) {
			this.bot.logger.info( `[hot-news]检测到动态[${ card.id_str }]渲染图的缓存，不再渲染新图，直接使用缓存内容.` )
			await this.sendMsg( type, targetId, imgMsg );
			return;
		}
		
		// 图可能比较大，单独再发送一张图
		const res = await renderer.asForFunction( `https:${ article.jump_url }`
			, this.articleDynamicPageFunction, this.viewPort );
		if ( res.code === 'ok' ) {
			imgMsg = this.asCqCode( res.data );
			await this.bot.redis.setString( `${ DB_KEY.img_msg_key }.${ card.id_str }`, imgMsg, 5 );
		} else {
			this.bot.logger.error( res.error );
			imgMsg = '(＞﹏＜)[图片渲染出错了，请自行前往B站查看最新动态。]';
		}
		await this.sendMsg( type, targetId, imgMsg );
	}
	
	private async sendMsg( type: number, targetId: number, msg: string ) {
		if ( type === MessageType.Private ) {
			await this.bot.client.sendPrivateMsg( targetId, msg )
		} else {
			await this.bot.client.sendGroupMsg( targetId, msg );
		}
	}
	
	private async normalDynamicHandle( id_str: string, { type, targetId }: ChatInfo ): Promise<void> {
		// 检测是否图片消息是否已经缓存
		let msg: string = await this.bot.redis.getString( `${ DB_KEY.img_msg_key }.${ id_str }` );
		if ( msg ) {
			this.bot.logger.info( `[hot-news]检测到动态[${ id_str }]渲染图的缓存，不再渲染新图，直接使用缓存内容.` )
			await this.sendMsg( type, targetId, msg );
			return;
		}
		
		const res = await renderer.asForFunction( `https://t.bilibili.com/${ id_str }`, this.normalDynamicPageFunction, this.viewPort );
		msg = `B站原神发布新动态了!`;
		if ( res.code === 'ok' ) {
			const cqCode = this.asCqCode( res.data );
			msg += "\n" + cqCode;
			await this.bot.redis.setString( `${ DB_KEY.img_msg_key }.${ id_str }`, msg, 5 );
		} else {
			this.bot.logger.error( res.error );
			msg += "(＞﹏＜)[图片渲染出错了，请自行前往B站查看最新动态。]"
		}
		await this.sendMsg( type, targetId, msg );
	}
	
	private asCqCode( base64Str: string ): string {
		const base64: string = `base64://${ base64Str }`;
		return `[CQ:image,file=${ base64 }]`;
	}
	
	private async normalDynamicPageFunction( page: puppeteer.Page ): Promise<Buffer | string | void> {
		// 把头部信息以及可能出现的未登录弹框删掉
		await page.$eval( "#internationalHeader", element => element.remove() );
		let card = await page.waitForSelector( ".card" );
		let clip = await card?.boundingBox();
		let bar = await page.waitForSelector( ".text-bar" )
		let bar_bound = await bar?.boundingBox();
		clip!.height = bar_bound!.y - clip!.y;
		return await page.screenshot( {
			type: "jpeg",
			clip: { x: clip!.x, y: clip!.y, width: clip!.width, height: clip!.height },
			encoding: "base64"
		} );
	}
	
	private async articleDynamicPageFunction( page: puppeteer.Page ): Promise<Buffer | string | void> {
		await page.$eval( "#internationalHeader", element => element.remove() );
		const option: puppeteer.ScreenshotOptions = { type: 'jpeg', encoding: "base64" };
		const element = await page.$( ".article-container__content" );
		if ( element ) {
			return await element.screenshot( option );
		}
		throw '渲染图片出错，未找到DOM节点';
	}
}