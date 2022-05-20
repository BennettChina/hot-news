import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { MessageScope, MessageType } from "@modules/message";
import { AuthLevel } from "@modules/management/auth";
import bot from "ROOT";
import { DB_KEY } from "#hot-news/achieves/subscribe_news";
import { Job, scheduleJob } from "node-schedule";
import { getBiliDynamicNew, getBiliLive, getNews } from "#hot-news/util/api";
import { getHashField } from "#hot-news/util/RedisUtils";
import { randomInt } from "#genshin/utils/random";
import * as sdk from "oicq";
import { segment } from "oicq";
import { config } from "#genshin/init";
import { Renderer } from "@modules/renderer";
import puppeteer from "puppeteer";
import { BOT } from "@modules/bot";

const subscribe_news: OrderConfig = {
	type: "order",
	cmdKey: "hot-news.subscribe_news",
	desc: [ "订阅新闻", "(订阅源)" ],
	headers: [ "subscribe_news" ],
	regexps: [ ".*" ],
	scope: MessageScope.Both,
	auth: AuthLevel.User,
	main: "achieves/subscribe_news",
	detail: "订阅每日热点新闻和B站原神动态，可用的新闻订阅源包括：新浪、知乎、网易、头条、百度，默认使用头条，仅可使用一个新闻源覆盖订阅(每天8:30~9点推送)。可用原神订阅源：原神"
};

const unsubscribe_news: OrderConfig = {
	type: "order",
	cmdKey: "hot-news.unsubscribe_news",
	desc: [ "取消订阅新闻", "(订阅源)" ],
	headers: [ "unsubscribe_news" ],
	regexps: [ ".*" ],
	scope: MessageScope.Both,
	auth: AuthLevel.User,
	main: "achieves/unsubscribe_news",
	detail: "取消订阅的新闻。可用订阅源：新闻源(新浪、知乎、网易、头条、百度)、原神，默认取消新闻订阅"
};

export let renderer: Renderer;

const notifyNews = async () => {
	bot.redis.getSet( DB_KEY.ids ).then( subs => {
		subs.forEach( sub => {
			const {
				targetId,
				type
			}: { targetId: number, type: number } = JSON.parse( sub );
			
			getHashField( DB_KEY.channel, `${ targetId }` ).then( channel => {
				getNews( channel ).then( news => {
					if ( type === MessageType.Private ) {
						bot.client.sendPrivateMsg( targetId, news )
					} else {
						bot.client.sendGroupMsg( targetId, news );
					}
				} ).catch( reason => {
					bot.logger.error( reason )
				} )
			} );
		} )
	} )
}

async function normalDynamicHandle( id_str: string, type: number, targetId: number ) {
	const res = await renderer.asForFunction( `https://t.bilibili.com/${ id_str }`, async ( page ) => {
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
	}, {
		width: 2000,
		height: 1000
	} );
	let msg = `B站原神发布新动态了!`;
	if ( res.code === 'ok' ) {
		const base64: string = `base64://${ res.data }`;
		const cqCode: string = `[CQ:image,file=${ base64 }]`;
		msg += "\n" + cqCode;
	} else {
		bot.logger.error( res.error );
		msg += "(＞﹏＜)[图片渲染出错了，请自行前往B站查看最新动态。]"
	}
	if ( type === MessageType.Private ) {
		await bot.client.sendPrivateMsg( targetId, msg )
	} else {
		await bot.client.sendGroupMsg( targetId, msg );
	}
}

const notifyGenshin = async () => {
	bot.redis.getSet( DB_KEY.genshin_ids ).then( subs => {
		subs.forEach( async sub => {
			const {
				targetId,
				type
			}: { targetId: number, type: number } = JSON.parse( sub );
			// B站动态信息推送
			const r = await getBiliDynamicNew();
			let liveDynamic: boolean = false;
			if ( r && r.length > 0 ) {
				const ids = await bot.redis.getSet( DB_KEY.genshin_dynamic_ids_key );
				for ( let card of r ) {
					if ( ids.includes( card.id_str ) ) {
						bot.logger.debug( `[hot-news]历史动态[${ card.id_str }]，跳过推送!` );
						continue;
					}
					
					// 专栏类型
					if ( card.type === 'DYNAMIC_TYPE_ARTICLE' ) {
						bot.logger.info( `[hot-news]获取到B站原神新动态[${ card.modules.module_dynamic.major.article?.desc }]` );
						const res = await renderer.asForFunction( `https://www.bilibili.com/read/cv${ card.basic.rid_str }`
							, async ( page ) => {
								await page.$eval( "#internationalHeader", element => element.remove() );
								const option: puppeteer.ScreenshotOptions = { type: 'jpeg', encoding: "base64" };
								const element = await page.$( ".article-container__content" );
								if ( element ) {
									return await element.screenshot( option );
								}
								throw '渲染图片出错，未找到DOM节点';
							}, {
								width: 2000,
								height: 1000
							} );
						let msg = `B站原神发布新动态了!\n ${ card.modules.module_dynamic.major.article?.desc }`;
						if ( type === MessageType.Private ) {
							await bot.client.sendPrivateMsg( targetId, msg )
						} else {
							await bot.client.sendGroupMsg( targetId, msg );
						}
						
						// 图可能比较大，单独再发送一张图
						let imgMsg: string;
						if ( res.code === 'ok' ) {
							imgMsg = res.data;
							const base64: string = `base64://${ res.data }`;
							imgMsg = `[CQ:image,file=${ base64 }]`;
						} else {
							bot.logger.error( res.error );
							imgMsg = '(＞﹏＜)[图片渲染出错了，请自行前往B站查看最新动态。]';
						}
						if ( type === MessageType.Private ) {
							await bot.client.sendPrivateMsg( targetId, imgMsg )
						} else {
							await bot.client.sendGroupMsg( targetId, imgMsg );
						}
					} else if ( card.type === 'DYNAMIC_TYPE_LIVE_RCMD' ) {
						// 直播动态处理完后直接返回，不需要后续再查询
						bot.logger.info( `[hot-news]获取到B站原神新动态[${ card.modules.module_dynamic.desc?.text }]` );
						await normalDynamicHandle( card.id_str, type, targetId );
						liveDynamic = true;
					} else {
						bot.logger.info( `[hot-news]获取到B站原神新动态[${ card.modules.module_dynamic.desc?.text }]` );
						await normalDynamicHandle( card.id_str, type, targetId );
					}
					
					// 把新的动态ID加入本地数据库
					await bot.redis.addSetMember( DB_KEY.genshin_dynamic_ids_key, card.id_str );
				}
			}
			
			// B站直播推送
			const notification_status = await bot.redis.getString( DB_KEY.genshin_live_notified );
			if ( !liveDynamic && !notification_status ) {
				const live = await getBiliLive();
				if ( live.liveRoom.liveStatus === 1 ) {
					const image = segment.image( live.liveRoom.cover, true, 10000 );
					const cqCode = segment.toCqcode( image );
					let msg = `B站${ live.name }开播啦!\n标题：${ live.liveRoom.title }\n直播间：${ live.liveRoom.url }\n${ cqCode }`
					if ( type === MessageType.Private ) {
						await bot.client.sendPrivateMsg( targetId, msg );
					} else {
						await bot.client.sendGroupMsg( targetId, msg );
					}
					await bot.redis.setString( DB_KEY.genshin_live_notified, "1", 8 * 60 * 60 );
				}
			}
		} )
	} )
}

/* 若开启必须添加好友，则删除好友后清除订阅服务 */
function decreaseFriend( { redis, config, logger }: BOT ) {
	return async function ( friendDate: sdk.FriendDecreaseEventData ) {
		if ( config.addFriend ) {
			const targetId = friendDate.user_id;
			let member: string = JSON.stringify( { targetId, type: MessageType.Private } )
			// 处理原神B站动态订阅
			const exist: boolean = await redis.existSetMember( DB_KEY.genshin_ids, member )
			if ( exist ) {
				await redis.delSetMember( DB_KEY.genshin_ids, member );
				await logger.info( `--[hot-news]--已为[${ targetId }]已取消订阅原神动态` );
			}
			
			// 处理新闻订阅
			const existNotify: boolean = await redis.existSetMember( DB_KEY.ids, member );
			if ( existNotify ) {
				await redis.delSetMember( DB_KEY.ids, member );
				await redis.delHash( DB_KEY.channel, `${ targetId }` );
				await logger.info( `--[hot-news]--已为[${ targetId }]已取消订阅新闻服务` );
			}
		}
	}
}

// 不可 default 导出，函数名固定
export async function init(): Promise<PluginSetting> {
	scheduleJob( "0 30 8 * * *", async () => {
		const sec: number = randomInt( 0, 180 );
		const time = new Date().setSeconds( sec * 10 );
		
		const job: Job = scheduleJob( time, async () => {
			await notifyNews();
			job.cancel();
		} );
		
	} );
	
	// 初始化B站原神动态数据
	bot.logger.info( "[hot-news]开始初始化B站原神动态数据..." )
	const dynamic_list = await getBiliDynamicNew();
	if ( dynamic_list ) {
		const ids: string[] = dynamic_list.map( d => d.id_str );
		await bot.redis.addSetMember( DB_KEY.genshin_dynamic_ids_key, ...ids );
		bot.logger.info( "[hot-news]初始化B站原神动态数据完成." );
	}
	
	/* 实例化渲染器 */
	renderer = bot.renderer.register( "hot-news", "/", config.serverPort, "" );
	scheduleJob( "0 0/3 * * * *", async () => {
		await notifyGenshin();
	} )
	
	// 监听好友删除事件
	bot.client.on( "notice.friend.decrease", decreaseFriend( bot ) );
	bot.logger.info( "[hot-news]好友删除事件监听已启动成功" )
	
	return {
		pluginName: "hot-news",
		cfgList: [ subscribe_news, unsubscribe_news ]
	};
}