const template = `<div class="news-card">
	<div class="top-ornament" aria-hidden="true">
		<span class="ornament-line"></span>
		<span class="ornament-dot"></span>
		<span class="ornament-line ornament-line-reverse"></span>
	</div>

	<header class="card-header">
		<div class="header-row">
			<div class="brand-block">
				<h1 class="brand-title">每天 <span class="brand-accent">60s</span> 读懂世界</h1>
				<div class="date-line">
					<span>{{ displayDate }}</span>
					<span class="date-star">❋</span>
					<span>农历<span class="date-dot">·</span>{{ lunarDate }}</span>
				</div>
			</div>
			<span class="header-divider" aria-hidden="true"></span>
			<div class="weekday">{{ weekday }}</div>
		</div>
	</header>

	<main class="news-body">
		<div class="news-list">
			<div v-for="( item, key ) of data" :key="key" class="news-item">
				<span class="news-index">{{ key + 1 }}</span>
				<p class="news-text">{{ item }}</p>
			</div>
		</div>
	</main>

	<section v-if="tip" class="tip-section">
		<div class="tip-content">
			<p class="tip-text">
				<span class="tip-quote">「</span>{{ tip }}<span class="tip-quote">」</span>
			</p>
		</div>
	</section>

	<footer class="card-footer">
		<div class="footer-left">
			<div class="footer-line">新闻联播<span class="slash">/</span>人民日报<span class="slash">/</span>新华网<span class="slash">/</span>腾讯新闻<span class="slash">/</span>环球网<span class="slash">/</span>澎湃新闻</div>
			<div class="footer-line">共 {{ data.length }} 条国内外精选新闻<span class="slash">/</span>更新于 {{ updatedTime }}</div>
		</div>
		<div class="footer-right">
			<div class="footer-line">@GitHub vikiboss/60s</div>
			<div class="footer-line">React 界面<span class="slash">/</span>TailwindCSS 样式<span class="slash">/</span>Puppeteer 渲染<span class="slash">/</span>抖音美好体</div>
		</div>
	</footer>
</div>`;

const { defineComponent, reactive, toRefs, onMounted } = Vue;

const WEEK_DAYS = [ "日", "一", "二", "三", "四", "五", "六" ];

function toChineseDay( day ) {
	const number = Number( day );
	const digits = [ "一", "二", "三", "四", "五", "六", "七", "八", "九" ];
	if ( number <= 10 ) return `初${ number === 10 ? "十" : digits[number - 1] }`;
	if ( number < 20 ) return `十${ digits[number - 11] }`;
	if ( number === 20 ) return "二十";
	if ( number < 30 ) return `廿${ digits[number - 21] }`;
	if ( number === 30 ) return "三十";
	return String( number );
}

function getLunarDate( date ) {
	try {
		const formatter = new Intl.DateTimeFormat( "zh-CN-u-ca-chinese", {
			year: "numeric",
			month: "long",
			day: "numeric"
		} );
		const parts = formatter.formatToParts( date );
		const yearName = parts.find( item => item.type === "yearName" )?.value || "";
		const month = parts.find( item => item.type === "month" )?.value || "";
		const day = parts.find( item => item.type === "day" )?.value || "";
		return `${ yearName }年${ month }${ toChineseDay( day ) }`;
	} catch {
		return "";
	}
}

function parseNewsDate( value ) {
	const match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/.exec( value || "" );
	if ( match?.groups ) {
		const { year, month, day } = match.groups;
		return new Date( Number( year ), Number( month ) - 1, Number( day ), 12 );
	}
	
	const today = new Date();
	const chineseMatch = /^(?<month>\d{1,2})月(?<day>\d{1,2})日$/.exec( value || "" );
	if ( chineseMatch?.groups ) {
		return new Date(
			today.getFullYear(),
			Number( chineseMatch.groups.month ) - 1,
			Number( chineseMatch.groups.day ),
			12
		);
	}
	return today;
}

function formatUpdatedTime( value, fallbackDate ) {
	if ( value ) {
		const time = Number( value );
		if ( Number.isFinite( time ) ) {
			return new Intl.DateTimeFormat( "zh-CN", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				hourCycle: "h23",
				timeZone: "Asia/Shanghai"
			} ).format( new Date( time ) );
		}
	}
	
	const date = fallbackDate;
	const dateText = [
		date.getFullYear(),
		String( date.getMonth() + 1 ).padStart( 2, "0" ),
		String( date.getDate() ).padStart( 2, "0" )
	].join( "/" );
	const timeText = [
		String( date.getHours() ).padStart( 2, "0" ),
		String( date.getMinutes() ).padStart( 2, "0" )
	].join( ":" );
	return `${ dateText } ${ timeText }`;
}

export default defineComponent( {
	name: "App",
	template,
	setup() {
		const state = reactive( {
			displayDate: "",
			lunarDate: "",
			weekday: "",
			updatedTime: "",
			data: [],
			tip: ""
		} );

		onMounted( async () => {
			await getData();
		} );

		async function getData() {
			try {
				const res = await fetch( "/hot-news/api/sixty" );
				const raw = await res.json();
				const date = parseNewsDate( raw.date || raw.time );
				
				state.displayDate = `${ date.getFullYear() }年${ date.getMonth() + 1 }月${ date.getDate() }日`;
				state.lunarDate = getLunarDate( date );
				state.weekday = `星期${ WEEK_DAYS[date.getDay()] }`;
				state.updatedTime = formatUpdatedTime( raw.updated_at, date );
				state.data = raw.data || [];
				state.tip = raw.tip ?? "";
			} catch {
				const date = new Date();
				state.displayDate = `${ date.getFullYear() }年${ date.getMonth() + 1 }月${ date.getDate() }日`;
				state.lunarDate = getLunarDate( date );
				state.weekday = `星期${ WEEK_DAYS[date.getDay()] }`;
				state.updatedTime = formatUpdatedTime( undefined, date );
			}
		}
		
		return {
			...toRefs( state )
		};
	}
} );
