const template = `<div class="container">
	<header :style="{ '--banner-color': bannerColor }">
		<h3>{{ time.week }}</h3>
	</header>
	<main>
		<h3>NEWS</h3>
		<div class="title">
			<p class="time-left">
				<span>农历</span>
				<span>{{ time.lunar?.replace( "农历", "" ) }}</span>
			</p>
			<h1>{{ title }}</h1>
			<p class="time-right">
				<span>{{ time.year }}</span>
				<span>{{ time.date }}</span>
			</p>
		</div>
		<ul class="content">
			<li v-for="( item, key ) of data" :key="key">
				<span v-if="key !== data.length - 1">{{ key + 1 }}、 </span>
				<span>{{ item }}</span>
			</li>
			<li v-if="sentence">{{ sentence }}</li>
		</ul>
	</main>
</div>`;

const { defineComponent, reactive, toRefs, onMounted, computed } = Vue;

export default defineComponent( {
	name: "App",
	template,
	setup() {
		const state = reactive( {
			headerBgColor: "#999",
			banner: "",
			title: "",
			sentence: "",
			time: {},
			data: []
		} );

		onMounted( async () => {
			await getData();
		} )
		
		const bannerColorMap = {
			"星期一": "#f85e42",
			"星期二": "#fd9534",
			"星期三": "#0290ed",
			"星期四": "#60a82e",
			"星期五": "#5c63e8",
			"星期六": "#fe4d80",
			"星期日": "#ec612a"
		}
		
		const bannerColor = computed( () => {
			return bannerColorMap[ state.time.week ] || "#999";
		} );

		async function getData() {
			const res = await fetch( "/hot-news/api/sixty" );
			const data = await res.json();
			
			const [ , year, date ] = data.time.date?.match( /^(\d+年)(.+)$/ ) || [];
			state.banner = data.banner || "";
			state.title = data.title || ""
			state.time = {
				week: data.time.week || "",
				lunar: data.time.lunar || "",
				year,
				date
			}
			state.data = data.data || []
			state.sentence = data.sentence || ""
		}

		return {
			...toRefs( state ),
			bannerColor
		}
	}
} );