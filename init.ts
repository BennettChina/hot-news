import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { MessageScope, MessageType } from "@modules/message";
import { AuthLevel } from "@modules/management/auth";
import bot from "ROOT";
import { DB_KEY } from "#hot-news/achieves/subscribe_news";
import { Job, scheduleJob } from "node-schedule";
import { BiliDynamicCard, getBiliDynamicNew, getBiliLive, getNews } from "#hot-news/util/api";
import { getHashField } from "#hot-news/util/RedisUtils";
import { randomInt } from "#genshin/utils/random";
import puppeteer, { Page } from "puppeteer";
import { segment } from "oicq";

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

async function normalDynamicHandle( page: Page, r: BiliDynamicCard, type: number, targetId: number ) {
	await page.goto( `https://t.bilibili.com/${ r.id_str }`, { waitUntil: "networkidle2" } )
	let card = await page.waitForSelector( ".card" );
	let clip = await card?.boundingBox();
	let bar = await page.waitForSelector( ".text-bar" )
	let bar_bound = await bar?.boundingBox();
	clip!.height = bar_bound!.y - clip!.y;
	let image_base64 = await page.screenshot( {
		type: "jpeg",
		clip: { x: clip!.x, y: clip!.y, width: clip!.width, height: clip!.height },
		encoding: "base64"
	} )
	const base64: string = `base64://${ image_base64 }`;
	const cqCode: string = `[CQ:image,file=${ base64 }]`;
	const msg = `B站原神发布新动态了!\n${ cqCode }`;
	if ( type === MessageType.Private ) {
		await bot.client.sendPrivateMsg( targetId, msg )
	} else {
		await bot.client.sendGroupMsg( targetId, msg );
	}
	await page.close()
}

const notifyGenshin = async ( browser: puppeteer.Browser ) => {
	bot.redis.getSet( DB_KEY.genshin_ids ).then( subs => {
		subs.forEach( async sub => {
			const {
				targetId,
				type
			}: { targetId: number, type: number } = JSON.parse( sub );
			// B站动态信息推送
			const r = await getBiliDynamicNew();
			if ( r ) {
				const page = await browser.newPage()
				// 专栏类型
				if ( r.type === 'DYNAMIC_TYPE_ARTICLE' ) {
					await page.goto( `https://www.bilibili.com/read/cv${ r.basic.rid_str }`, { waitUntil: "networkidle2" } )
					const el = await page.waitForSelector( ".article-container__content" );
					const res = await el?.screenshot( { type: "jpeg", encoding: "base64" } );
					const base64: string = `base64://${ res }`;
					const cqCode: string = `[CQ:image,file=${ base64 }]`;
					const msg = `B站原神发布新动态了!\n${ cqCode }`;
					if ( type === MessageType.Private ) {
						await bot.client.sendPrivateMsg( targetId, msg )
					} else {
						await bot.client.sendGroupMsg( targetId, msg );
					}
					await page.close()
				} else if ( r.type === 'DYNAMIC_TYPE_LIVE_RCMD' ) {
					// 直播动态处理完后直接返回，不需要后续再查询
					await normalDynamicHandle( page, r, type, targetId );
					return;
				} else {
					await normalDynamicHandle( page, r, type, targetId );
				}
			}
			
			// B站直播推送
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
			}
		} )
	} )
}

const launchBrowser: () => Promise<puppeteer.Browser> = async () => {
	return new Promise( async ( resolve, reject ) => {
		try {
			const browser = await puppeteer.launch( {
				headless: true,
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-dev-shm-usage"
				],
				defaultViewport: {
					width: 2000,
					height: 1000
				}
			} );
			bot.logger.info( "浏览器启动成功" );
			resolve( browser );
		} catch ( error ) {
			const err: string = `浏览器启动失败: ${ ( <Error>error ).stack }`;
			await bot.message.sendMaster( err );
			bot.logger.error( err );
		}
	} );
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
	
	const browser = await launchBrowser();
	scheduleJob( "0 0/3 * * * *", async () => {
		await notifyGenshin( browser );
	} )
	
	return {
		pluginName: "hot-news",
		cfgList: [ subscribe_news, unsubscribe_news ]
	};
}