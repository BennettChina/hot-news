// 获取 待推送目标 - qq 列表的映射表（这个 uid 共被哪些 qq 订阅了）
export function getTargetQQMap<T>( subs: Record<string, string>, format?: ( subStr: string ) => any ) {
	const target_qq_map = new Map<T, Set<string>>();

	for ( const qq in subs ) {
		let subStr = subs[qq];
		subStr = format ? format( subStr ) : subStr;

		try {
			const sub = JSON.parse( subStr );
			if ( !( Array.isArray( sub ) ) ) continue;
			sub.forEach( ( uid: T ) => {
				const qqList = target_qq_map.get( uid ) || new Set<string>();
				qqList.add( qq );
				target_qq_map.set( uid, qqList );
			} );
		} catch {}
	}

	return target_qq_map;
}

export function transformCookie( cookie: string ): Record<string, string>;

export function transformCookie( cookie: Record<string, string> ): string;

export function transformCookie( cookie: string | Record<string, string> ): Record<string, string> | string {
	if ( typeof cookie === "string" ) {
		return decodeURIComponent( cookie ).split( ";" )
			.filter( item => !!item && item.trim().length > 0 )
			.reduce( ( acc, item ) => {
				const delimiter = item.indexOf( '=' );
				const key = item.substring( 0, delimiter ).trim();
				acc[key] = item.substring( delimiter + 1 ).trim();
				return acc;
			}, {} );
	}
	return Object.entries( cookie )
		.map( ( [ k, v ] ) => {
			return `${ k }=${ v }`;
		} )
		.join( ";" );
}