import { NewsService } from "#hot-news/module/news/NewsService";
import { segment, Sendable } from "icqq";
import {
	BiliDynamicCard,
	BiliDynamicMajorArchive,
	BiliDynamicMajorArticle,
	BiliDynamicMajorOpus,
	ChatInfo,
	DynamicInfo
} from "#hot-news/types/type";
import { getHashField } from "#hot-news/util/RedisUtils";
import { DB_KEY } from "#hot-news/util/constants";
import { getBiliDynamicNew } from "#hot-news/util/api";
import { formatTimestamp, wait } from "#hot-news/util/tools";
import { config, renderer } from "#hot-news/init";
import bot from "ROOT";
import { MessageMethod } from "#hot-news/module/message/MessageMethod";
import { RenderResult } from "@modules/renderer";
import { ScreenshotService } from "#hot-news/module/screenshot/ScreenshotService";
import puppeteer from "puppeteer";

export class BiliDynamicImpl implements NewsService {
	private readonly viewPort: puppeteer.Viewport = {
		width: 2000,
		height: 1000,
		deviceScaleFactor: 2
	}
	
	async getInfo( channel?: string ): Promise<Sendable> {
		return "";
	}
	
	async handler(): Promise<void> {
		const set = await bot.redis.getSet( DB_KEY.sub_bili_ids_key );
		for ( const sub of set ) {
			// 获取QQ号/QQ群号
			const chatInfo: ChatInfo = JSON.parse( sub );
			// 获取用户订阅的UP的uid
			const uidListStr = await getHashField( DB_KEY.notify_bili_ids_key, `${ chatInfo.targetId }` ) || "[]";
			const uidList: number[] = JSON.parse( uidListStr );
			
			// B站动态信息推送
			let cards: BiliDynamicCard[] = [];
			for ( let uid of uidList ) {
				const r = await getBiliDynamicNew( uid, false, config.biliDynamicApiCacheTime );
				if ( r.length > 0 ) {
					cards.push( ...r );
				}
			}
			const limit = await bot.redis.getString( `${ DB_KEY.limit_bili_dynamic_time_key }.${ chatInfo.targetId }` );
			// 默认消息24小时即为过期
			let limitMillisecond = 24 * 60 * 60 * 1000;
			if ( limit ) {
				limitMillisecond = parseInt( limit ) * 60 * 60 * 1000;
			}
			
			let i = 0;
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
					bot.logger.info( `[hot-news] [${ name }]-[${ pub_tss }]发布的动态[${ card.id_str }]已过时不再推送!` )
					// 把新的动态ID加入本地数据库
					await bot.redis.addSetMember( `${ DB_KEY.bili_dynamic_ids_key }.${ uid }`, card.id_str );
					continue;
				}
				
				// 把动态信息缓存，后续渲染截图需要使用
				await bot.redis.setString( `${ DB_KEY.bili_dynamic_info_key }.${ card.id_str }`, JSON.stringify( card ), config.biliDynamicApiCacheTime );
				
				// 专栏类型
				if ( card.type === 'DYNAMIC_TYPE_ARTICLE' ) {
					await this.articleHandle( card, chatInfo );
					i++;
				} else if ( card.type === 'DYNAMIC_TYPE_LIVE_RCMD' ) {
					// do nothing
				} else if ( card.type === "DYNAMIC_TYPE_AV" ) {
					bot.logger.info( `[hot-news] 获取到B站[${ name }]-[${ pub_tss }]发布的新动态 [${ card.id_str }] [${ card.modules.module_dynamic.desc?.text || "投稿视频" }]` );
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
					i++;
				} else {
					bot.logger.info( `[hot-news] 获取到B站[${ name }]-[${ pub_tss }]发布的新动态 [${ card.id_str }] [${ card.modules.module_dynamic.desc?.text }]` );
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
					i++;
				}
				
				// 把新的动态ID加入本地数据库
				await bot.redis.addSetMember( `${ DB_KEY.bili_dynamic_ids_key }.${ uid }`, card.id_str );
			}
			
			if ( config.pushLimit.enable && i > config.pushLimit.limitTimes ) {
				await wait( config.pushLimit.limitTime * 1000 );
				i = 0;
			}
		}
	}
	
	private async articleHandle( card: BiliDynamicCard, { type, targetId }: ChatInfo ): Promise<void> {
		let desc = "", title = "", jump_url = "", label = "";
		if ( card.modules.module_dynamic.major?.type === 'MAJOR_TYPE_ARTICLE' ) {
			const {
				desc: _desc,
				title: _title,
				jump_url: _jump_url,
				label: _label
			} = ( <BiliDynamicMajorArticle>card.modules.module_dynamic.major ).article;
			[ desc, title, jump_url, label ] = [ _desc, _title, _jump_url, _label ];
		} else if ( card.modules.module_dynamic.major?.type === 'MAJOR_TYPE_OPUS' ) {
			const {
				title: _title,
				jump_url: _jump_url,
				summary: { text }
			} = ( <BiliDynamicMajorOpus>card.modules.module_dynamic.major ).opus;
			[ desc, title, jump_url, label ] = [ text, _title, _jump_url, "" ];
		}
		const { name, mid: uid, pub_time, pub_ts } = card.modules.module_author;
		const id = card.id_str;
		const {
			comment: { count: comment_num },
			like: { count: like_num },
			forward: { count: forward_num }
		} = card.modules.module_stat;
		const pub_tsm: number = pub_ts * 1000;
		const pub_tss: string = formatTimestamp( pub_tsm );
		bot.logger.info( `[hot-news] 获取到B站-[${ pub_tss }]发布的${ name }新动态 [${ id }] [${ desc }]` );
		const url = `https:${ jump_url }`;
		const params: Record<string, any> = {
			id,
			name,
			uid,
			pub_time,
			pub_tss,
			like_num,
			comment_num,
			forward_num,
			title,
			label,
			url,
			desc
		}
		const msg: Sendable = MessageMethod.parseTemplate( config.articleDynamicTemplate, params );
		await MessageMethod.sendMsg( type, targetId, msg );
		
		let imgMsg: Sendable;
		if ( config.screenshotType === 2 ) {
			const res: RenderResult = await renderer.asSegment(
				"/dynamic.html",
				{ dynamicId: card.id_str },
				this.viewPort
			);
			if ( res.code === "ok" ) {
				imgMsg = res.data;
			} else {
				bot.logger.error( res.error );
				imgMsg = MessageMethod.parseTemplate( config.errorMsgTemplate, params );
			}
		} else {
			// 直接截B站的图
			const res = await renderer.asForFunction( url, ScreenshotService.articleDynamicPageFunction, this.viewPort );
			if ( res.code === 'ok' ) {
				imgMsg = res.data;
			} else {
				bot.logger.error( res.error );
				imgMsg = MessageMethod.parseTemplate( config.errorMsgTemplate, params );
			}
		}
		await MessageMethod.sendMsg( type, targetId, imgMsg );
	}
	
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
		let message: Sendable;
		const url = `https://t.bilibili.com/${ id }`;
		let img: Sendable = "";
		let ok: boolean = false;
		if ( config.screenshotType === 2 ) {
			const res: RenderResult = await renderer.asSegment(
				"/dynamic.html",
				{ dynamicId: id },
				this.viewPort
			);
			if ( res.code === "ok" ) {
				img = res.data;
				ok = true;
			} else {
				bot.logger.error( res.error );
			}
		} else {
			const res = await renderer.asForFunction( url, ScreenshotService.normalDynamicPageFunction, this.viewPort );
			if ( res.code === "ok" ) {
				img = res.data;
				ok = true;
			} else {
				bot.logger.error( res.error );
			}
		}
		if ( ok ) {
			// 如果是视频投稿，那么把cover转为 ImageElem 对象
			if ( archive ) {
				archive.cover = segment.image( <string>archive.cover, true, 60 );
				archive.jump_url = "https:" + archive.jump_url;
				const params: Record<string, any> = {
					id,
					name,
					uid,
					pub_time,
					pub_tss,
					like_num,
					comment_num,
					forward_num,
					url,
					img,
					archive
				}
				message = MessageMethod.parseTemplate( config.videoDynamicTemplate, params );
			} else {
				const params: Record<string, any> = {
					id,
					name,
					uid,
					pub_time,
					pub_tss,
					like_num,
					comment_num,
					forward_num,
					url,
					img
				}
				message = MessageMethod.parseTemplate( config.dynamicTemplate, params );
			}
		} else {
			const params: Record<string, any> = {
				id,
				name,
				uid,
				pub_time,
				pub_tss,
				like_num,
				comment_num,
				forward_num,
				url
			}
			message = MessageMethod.parseTemplate( config.errorMsgTemplate, params );
		}
		await MessageMethod.sendMsg( type, targetId, message );
	}
	
	private completeProtocol( base64Str: string ): string {
		return `base64://${ base64Str }`;
	}
}