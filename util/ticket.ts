import axios, { AxiosError } from "axios";
import crypto from "crypto";

/**
 * Generate HMAC-SHA256 signature
 * @param {string} key     The key string to use for the HMAC-SHA256 hash
 * @param {string} message The message string to hash
 * @returns {string} The HMAC-SHA256 signature as a hex string
 */
function hmacSha256( key: string, message: string ): string {
	const hmac = crypto.createHmac( 'sha256', key );
	hmac.update( message );
	return hmac.digest( 'hex' );
}

/**
 * Get Bilibili web ticket
 * @param userAgent browser user-agent
 * @param {string} csrf    CSRF token, can be empty or null
 * @returns {Promise<any>} Promise of the ticket response in JSON format
 */
export async function getBiliTicket( userAgent: string, csrf?: string ): Promise<any> {
	const ts = Date.now() / 1000 | 0;
	const hexSign = hmacSha256( 'XgwSnGZ1p', `ts${ ts }` );
	const url = 'https://api.bilibili.com/bapis/bilibili.api.ticket.v1.Ticket/GenWebTicket';
	const response = await axios.post( url, undefined, {
		headers: {
			'User-Agent': userAgent
		},
		params: {
			key_id: 'ec02',
			hexsign: hexSign,
			'context[ts]': `${ ts }`,
			csrf: csrf || ''
		}
	} ).catch( ( reason: AxiosError ) => {
		throw reason.message;
	} );
	if ( response.data.code !== 0 ) {
		throw response.data.message;
	}
	return response.data.data;
}