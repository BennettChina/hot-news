import { transformCookie } from "#/hot-news/util/format";

export function checkCookie( cookie: string ): boolean {
	if ( !cookie ) return false;
	const properties = [ "_uuid", "buvid3", "buvid4", "bili_ticket", "bili_ticket_expires", "buvid_fp" ];
	const record = transformCookie( cookie );
	const expire_time = parseInt( record.bili_ticket_expires ) || 0;
	const now = Date.now() / 1000 | 0;
	if ( now > expire_time ) {
		return false;
	}
	return properties.every( ( key ) => !!record[key] );
}
