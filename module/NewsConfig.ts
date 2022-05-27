import { RefreshCatch } from "@modules/management/refresh";

export default class NewsConfig {
	public maxSubscribeNum: number;
	
	public static init = {
		maxSubscribeNum: 5
	};
	
	constructor( config: any ) {
		this.maxSubscribeNum = config.maxSubscribeNum;
	}
	
	public async refresh( config ): Promise<string> {
		try {
			this.maxSubscribeNum = config.maxSubscribeNum;
			return "hot_news.yml 重新加载完毕";
		} catch ( error ) {
			throw <RefreshCatch>{
				log: ( <Error>error ).stack,
				msg: "hot_news.yml 重新加载失败，请前往控制台查看日志"
			};
		}
	}
}