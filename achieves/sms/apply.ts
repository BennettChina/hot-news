import { defineDirective, InputParameter } from "@/modules/command";
import { NewsServiceFactory } from "#/hot-news/module/NewsServiceFactory";
import { ForwardElem, ForwardElemCustomNode } from "@/modules/lib";
import { DB_KEY } from "#/hot-news/util/constants";
import { config } from "#/hot-news/init";

export default defineDirective( "enquire", async ( {
	                                                   sendMessage, messageData, matchResult, client, logger, redis
                                                   }: InputParameter ) => {
	const qq = messageData.user_id;
	const data = messageData.raw_message;
	
	if ( !config.apiDomain ) {
		await sendMessage( "本 BOT 尚不支持短信转发服务。" );
	}
	
	if ( matchResult.status === "activate" ) {
		await sendMessage( '免责声明：开启本服务可以把短信转发App中获取的短信转发到此 BOT，然后由 BOT 转发给您，' +
			'这可能会在部分服务中产生日志信息，造成个人隐私泄漏，请您在使用时慎重考虑。以及本服务通过 SmsForwarder App 实现，' +
			'请先访问该在线文档 https://gitee.com/pp/SmsForwarder/wikis/pages 了解该 App 后再考虑是否使用本服务。' +
			'如仍要继续，请输入「确认」 ，可输入「取消」退出本次服务，或等待 1 分钟后自动退出。' );
		return;
	}
	
	if ( matchResult.status === "confirm" ) {
		if ( data === "取消" ) {
			await sendMessage( "已取消订阅短信服务申请" );
			return true;
		}
		if ( data !== "确认" ) {
			await sendMessage( "请输入「确认」以确认订阅短信服务，可输入「取消」退出本次服务，或等待 1 分钟后自动退出。" );
			return false;
		}
		try {
			const webhook = await NewsServiceFactory.instance( "sms" ).getInfo( qq.toString( 10 ) );
			const info = await client.getLoginInfo();
			if ( info.retcode !== 0 || !info.data.nickname ) {
				logger.warn( "获取 Bot 的昵称失败:", info.wording );
			}
			const nickname = info.data.nickname || "Bot";
			const user_id = client.uin;
			
			const messages: ForwardElemCustomNode[] = [
				{
					nickname,
					user_id,
					content: "以下是短信转发App要使用的 Webhook 地址和 SM4 的密钥，请复制到短信转发App中进行订阅。"
				},
				{
					nickname,
					user_id,
					content: webhook
				},
				{
					nickname,
					user_id,
					content: await redis.getHashField( DB_KEY.sms_secret, qq.toString( 10 ) )
				},
				{
					nickname,
					user_id,
					content: "小提示：转发App通知时要把QQ(com.tencent.mobileqq)的通知不包含进去，否则可能会产生循环通知。"
				}
			]
			const forwardMsg: ForwardElem = {
				type: "forward",
				messages
			}
			await sendMessage( forwardMsg );
		} catch ( error: any ) {
			if ( typeof error === "string" ) {
				await sendMessage( error + "如需取消申请，请输入「取消」。" );
				return false;
			}
			throw error;
		}
	}
	
	if ( matchResult.status === "timeout" ) {
		await sendMessage( "订阅短信服务申请超时，BOT 自动取消" )
	}
} );