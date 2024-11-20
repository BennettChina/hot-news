import bot from "ROOT";
import express from "express";
import { DB_KEY } from "#/hot-news/util/constants";
import moment from "moment";

export default express.Router().get( "/", async ( req, res ) => {
	const todayStr = moment().format( "YYYYMMDD" );
	const cache = await bot.redis.getString( `${ DB_KEY["60s_img_data_key"] }.${ todayStr }` );
	try {
		res.send( JSON.parse( cache ) );
	} catch {
		res.send( {} );
	}
} );