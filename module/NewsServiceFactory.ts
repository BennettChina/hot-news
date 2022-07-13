import { HotNewsServiceImpl } from "#hot-news/module/news/impl/HotNewsServiceImpl";
import { NewsService } from "#hot-news/module/news/NewsService";
import { CHANNEL_NAME } from "#hot-news/util/constants";
import { MessAroundServiceImpl } from "#hot-news/module/news/impl/MessAroundServiceImpl";

export class NewsServiceFactory {
	/**
	 * 创建服务的实例
	 * @param channel 渠道名称
	 */
	public static instance( channel: string ): NewsService {
		switch ( channel ) {
			case CHANNEL_NAME.zhihu:
			case CHANNEL_NAME.baidu:
			case CHANNEL_NAME.sina:
			case CHANNEL_NAME.wangyi:
			case CHANNEL_NAME.toutiao:
				return new HotNewsServiceImpl();
			case CHANNEL_NAME.moyu:
				return new MessAroundServiceImpl();
			default:
				throw "不支持的订阅渠道";
		}
	}
}