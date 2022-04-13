import bot from "ROOT";

export const getHashField: ( key: string, field: string ) => Promise<string> = ( key: string, field: string ) => {
	return new Promise( ( resolve, reject ) => {
		bot.redis.client.hget( key, field, ( error: Error | null, data: string ) => {
			if ( error !== null ) {
				reject( error );
			} else {
				resolve( data || "" );
			}
		} )
	} );
}