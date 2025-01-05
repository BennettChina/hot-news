export class RetryError extends Error {
	constructor( message: string, stack?: any ) {
		super( message );
		this.name = 'RetryError';
		this.stack = stack;
	}
}