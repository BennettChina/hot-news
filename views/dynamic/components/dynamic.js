const template = `<div class="dynamic-main">
	<div class="opus-module-content">
	   	<p>
	   		<div class="bili-dyn-content__orig__topic" v-if="dynamic.topic">
		        <div class="bili-dyn-topic">
		            <div class="bili-dyn-topic__card">
		                <svg viewBox="0 0 16 16" class="bili-dyn-topic__icon">
		                    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4302 2.07458C11.4416 2.01023 11.4439 1.93974 11.4218 1.8528C11.3281 1.48196 10.9517 1.22037 10.5284 1.2527C10.432 1.26018 10.3599 1.28383 10.297 1.31376C10.2347 1.34398 10.1832 1.38155 10.1401 1.42465C10.1195 1.44485 10.1017 1.46692 10.0839 1.48897L10.0808 1.49289L10.0237 1.56277L9.91103 1.7033C9.76177 1.89141 9.61593 2.08191 9.47513 2.27556C9.33433 2.46936 9.19744 2.66585 9.06672 2.86638C9.00275 2.96491 8.93968 3.06401 8.87883 3.16461L8.56966 3.1613C8.00282 3.1574 7.43605 3.15952 6.86935 3.17034C6.80747 3.06778 6.74325 2.96677 6.67818 2.8664C6.54732 2.66585 6.41045 2.46934 6.26968 2.27568C6.12891 2.08186 5.98309 1.89134 5.83387 1.70322L5.72122 1.56268L5.66416 1.49279L5.6622 1.49036C5.64401 1.46783 5.62586 1.44535 5.60483 1.42454C5.56192 1.38144 5.51022 1.34388 5.44797 1.31364C5.38522 1.28386 5.31305 1.26006 5.21665 1.25273C4.80555 1.22085 4.4203 1.47094 4.32341 1.85273C4.30147 1.93968 4.30358 2.01018 4.31512 2.07453C4.32715 2.13859 4.34975 2.19546 4.38112 2.24649C4.39567 2.27075 4.41283 2.29315 4.42999 2.31557C4.43104 2.31694 4.43209 2.31831 4.43314 2.31968L4.48759 2.39122L4.59781 2.53355C4.74589 2.72242 4.89739 2.90905 5.05377 3.09254C5.09243 3.13788 5.13136 3.18306 5.17057 3.22785C4.99083 3.23681 4.81112 3.2467 4.63143 3.25756C4.41278 3.271 4.19397 3.28537 3.97547 3.30206L3.64757 3.32786L3.48362 3.34177L3.39157 3.35181C3.36984 3.3543 3.34834 3.3577 3.32679 3.36111C3.31761 3.36257 3.30843 3.36402 3.29921 3.36541C3.05406 3.40681 2.81526 3.48901 2.59645 3.60752C2.37765 3.72603 2.17867 3.88039 2.00992 4.06302C1.84117 4.24565 1.70247 4.45593 1.60144 4.68337C1.50025 4.9105 1.43687 5.15447 1.41362 5.40153C1.33103 6.27513 1.27663 7.1515 1.25742 8.0302C1.23758 8.90951 1.25835 9.78913 1.3098 10.6655C1.32266 10.8846 1.33738 11.1035 1.35396 11.3223L1.38046 11.6505L1.39472 11.8144L1.39658 11.835L1.39906 11.8583L1.40417 11.9048C1.40671 11.9305 1.41072 11.9558 1.41473 11.9811C1.41561 11.9866 1.41648 11.9922 1.41734 11.9977C1.45717 12.2449 1.53806 12.4859 1.65567 12.7074C1.77314 12.9289 1.92779 13.1304 2.11049 13.3022C2.29319 13.474 2.50441 13.6159 2.73329 13.7197C2.96201 13.8235 3.2084 13.8901 3.45836 13.9135C3.47066 13.915 3.48114 13.9159 3.49135 13.9167C3.49477 13.917 3.49817 13.9173 3.50159 13.9176L3.5425 13.9212L3.62448 13.9283L3.78843 13.9417L4.11633 13.9674C4.33514 13.9831 4.55379 13.9983 4.7726 14.0111C6.52291 14.1145 8.27492 14.1346 10.0263 14.0706C10.4642 14.0547 10.9019 14.0332 11.3396 14.0062C11.5584 13.9923 11.7772 13.9776 11.9959 13.9604L12.3239 13.934L12.4881 13.9196L12.5813 13.9093C12.6035 13.9065 12.6255 13.903 12.6474 13.8995C12.6565 13.8981 12.6655 13.8966 12.6746 13.8952C12.9226 13.8527 13.1635 13.7691 13.3844 13.6486C13.6052 13.5284 13.8059 13.3716 13.9759 13.1868C14.1463 13.0022 14.2861 12.7892 14.3874 12.5593C14.4381 12.4444 14.4793 12.3253 14.5108 12.2037C14.519 12.1734 14.5257 12.1428 14.5322 12.112L14.5421 12.066L14.55 12.0196C14.5556 11.9887 14.5607 11.9578 14.5641 11.9266C14.5681 11.8959 14.5723 11.863 14.5746 11.8373C14.6642 10.9637 14.7237 10.0864 14.7435 9.20617C14.764 8.325 14.7347 7.44337 14.6719 6.56715C14.6561 6.3479 14.6385 6.12896 14.6183 5.91033L14.5867 5.58246L14.5697 5.41853L14.5655 5.37758C14.5641 5.36445 14.5618 5.3473 14.5599 5.33231C14.5588 5.3242 14.5578 5.31609 14.5567 5.30797C14.5538 5.28514 14.5509 5.26229 14.5466 5.2396C14.5064 4.99301 14.4252 4.75275 14.3067 4.53242C14.1886 4.31208 14.0343 4.11153 13.8519 3.94095C13.6695 3.77038 13.4589 3.62993 13.2311 3.52733C13.0033 3.42458 12.7583 3.35907 12.5099 3.33636C12.4974 3.33492 12.4865 3.33394 12.4759 3.333C12.4729 3.33273 12.4698 3.33246 12.4668 3.33219L12.4258 3.32879L12.3438 3.32199L12.1798 3.30886L11.8516 3.28413C11.633 3.26915 11.4143 3.25478 11.1955 3.24288C10.993 3.23147 10.7904 3.22134 10.5878 3.21243L10.6914 3.09236C10.8479 2.90903 10.9992 2.72242 11.1473 2.53341L11.2576 2.39124L11.312 2.31971C11.3136 2.31773 11.3151 2.31575 11.3166 2.31377C11.3333 2.29197 11.3501 2.27013 11.3641 2.24653C11.3954 2.1955 11.418 2.13863 11.4302 2.07458ZM9.33039 4.99268C9.38381 4.66945 9.67705 4.45281 9.98536 4.50882L9.98871 4.50944C10.2991 4.56783 10.5063 4.87802 10.4524 5.20377L10.2398 6.49039L11.3846 6.4904C11.7245 6.4904 12 6.77925 12 7.13557C12 7.49188 11.7245 7.78073 11.3846 7.78073L10.0266 7.78059L9.7707 9.32911L11.0154 9.32913C11.3553 9.32913 11.6308 9.61799 11.6308 9.9743C11.6308 10.3306 11.3553 10.6195 11.0154 10.6195L9.55737 10.6195L9.32807 12.0073C9.27465 12.3306 8.98141 12.5472 8.6731 12.4912L8.66975 12.4906C8.35937 12.4322 8.1522 12.122 8.20604 11.7962L8.40041 10.6195H6.89891L6.66961 12.0073C6.61619 12.3306 6.32295 12.5472 6.01464 12.4912L6.01129 12.4906C5.7009 12.4322 5.49374 12.122 5.54758 11.7962L5.74196 10.6195L4.61538 10.6195C4.27552 10.6195 4 10.3306 4 9.9743C4 9.61799 4.27552 9.32913 4.61538 9.32913L5.95514 9.32911L6.21103 7.78059L4.98462 7.78073C4.64475 7.78073 4.36923 7.49188 4.36923 7.13557C4.36923 6.77925 4.64475 6.4904 4.98462 6.4904L6.42421 6.49039L6.67193 4.99268C6.72535 4.66945 7.01859 4.45281 7.3269 4.50882L7.33025 4.50944C7.64063 4.56783 7.8478 4.87802 7.79396 5.20377L7.58132 6.49039H9.08281L9.33039 4.99268ZM8.61374 9.32911L8.86963 7.78059H7.36813L7.11225 9.32911H8.61374Z" fill="currentColor"></path>
		                </svg>
		                <div class="bili-dyn-topic__text">{{dynamic.topic.name}}</div>
		            </div>
		        </div>
		    </div>
	    	<template v-for="item in rich_text_nodes">
		        <span v-if="item.type === 'RICH_TEXT_NODE_TYPE_LOTTERY'" class="opus-text-rich-hl lottery">{{item.text}}</span>
		        <a :href="item.jump_url" target="_blank" class="opus-text-rich-hl topic" v-if="item.type === 'RICH_TEXT_NODE_TYPE_TOPIC'">{{item.text}}</a>
		        <span style="font-size:17px;" v-if="item.type === 'RICH_TEXT_NODE_TYPE_TEXT'">{{item.text}}</span>
		        <span class="opus-text-rich-hl at" v-if="item.type === 'RICH_TEXT_NODE_TYPE_AT'">{{item.text}}</span>
		        <a :href="item.jump_url" target="_blank" class="opus-text-rich-hl link" v-if="item.type === 'RICH_TEXT_NODE_TYPE_WEB'">{{item.text}}</a>
		        <span class="opus-text-rich-hl vote" v-if="item.type === 'RICH_TEXT_NODE_TYPE_VOTE'">{{item.text}}</span>
		        <span class="opus-text-rich-hl video" v-if="item.type === 'RICH_TEXT_NODE_TYPE_BV'">{{item.text}}</span>
		        <span class="opus-text-rich-hl video" v-if="item.type === 'RICH_TEXT_NODE_TYPE_AV'">{{item.text}}</span>
		        <span v-if="item.type === 'RICH_TEXT_NODE_TYPE_OGV_SEASON'" class="opus-text-rich-hl video">{{ item.text }}</span>
		        <img :alt="item.text" :src="item.emoji.icon_url" class="opus-text-rich-emoji" v-if="item.type === 'RICH_TEXT_NODE_TYPE_EMOJI'">
		        <span class="opus-text-rich-hl goods" v-if="item.type === 'RICH_TEXT_NODE_TYPE_GOODS'">{{ item.text }}}</span>
		        <span v-if="item.type === 'RICH_TEXT_NODE_TYPE_MAIL'" style="font-size:17px;">{{ item.text }}</span>
			</template>
	   	</p>
	   <div class="opus-para-pic" v-if="type === 'DYNAMIC_TYPE_DRAW'">
		   <div class="bili-album">
		   		<div class="bili-album__watch" v-if="majorClass === 'one'">
					<div class="bili-album__watch__content">
						<img :src="majorItems[0].url" alt="动态图片">
					</div>
				</div>
			   <div class="bili-album__preview" :class="majorClass" v-else>
				   <div class="bili-album__preview__picture" v-for="item in majorItems" :style="item.style">
				        <img :src="item.url" class="bili-album__preview__picture__img bili-awesome-img" alt="动态图片"/>
				   </div>
			   </div>
		   </div>
	   </div>
	   
	   <div class="bili-dyn-content__orig__major suit-video-card gap" v-if="type === 'DYNAMIC_TYPE_AV'">
	   		<a :href="dynamic.major.archive.jump_url" class="bili-dyn-card-video hide-border">
		        <div class="bili-dyn-card-video__header">
		            <div class="bili-dyn-card-video__cover">
		                <img :src="majorArchive.cover" class="bili-awesome-img" :style="majorArchive.coverStyle" alt="视频封面"/>
	                    <div class="bili-dyn-card-video__cover__mask">
                            <div class="dyn-video-preview" style="display: none;">
	                            <div class="dyn-video-preview__progress">
	                                <div class="dyn-video-preview__progress__bar">
	                                    <span style="width: 0;"></span>
	                                </div>
	                            </div>
	                            <div class="dyn-video-preview__shot"></div>
		                        <div class="dyn-video-preview__danmaku"></div>
	                    	</div>
		                    <div class="bili-dyn-card-video__mark">
		                        <div class="bili-dyn-card-video__mark__tip" style="display: none;"></div>
		                    </div>
	                    </div>
		                <div class="bili-dyn-card-video__cover-shadow">
		                	<div class="duration-time">{{dynamic.major.archive.duration_text}}</div>
		            	</div>
		        	</div>
		    	</div>
			    <div class="bili-dyn-card-video__body">
			        <div class="bili-dyn-card-video__title bili-ellipsis fs-medium">{{dynamic.major.archive.title}}</div>
			        <div class="bili-dyn-card-video__desc bili-ellipsis fs-small">{{dynamic.major.archive.desc}}</div>
					<div class="bili-dyn-card-video__stat fs-small">
						<div class="bili-dyn-card-video__stat__item play"><i></i> <span>{{dynamic.major.archive.stat.play}}</span></div>
						<div class="bili-dyn-card-video__stat__item danmaku"><i></i> <span>{{dynamic.major.archive.stat.danmaku}}</span></div>
					</div>
				</div>
			</a>
		</div>
		
		<div class="bili-dyn-content__orig__major suit-video-card" v-if="type === 'DYNAMIC_TYPE_ARTICLE'">
			<div class="dyn-card-opus hide-border">
				<div class="dyn-card-opus__title bili-ellipsis">{{majorArticle.title}}</div>
				<div class="dyn-card-opus__summary">
					<div class="bili-rich-text" style="font-size: 15px;">
						<div class="bili-rich-text__content folded line--4" style="line-height: 25px; max-height: 100px;">
							<span class="virturl-start"></span>
							<span>{{majorArticle.desc}}</span>
						</div>
						<div class="bili-rich-text__action">全文</div>
					</div>
				</div>
				<div class="bili-album__watch" v-if="majorArticle.cover">
					<div class="bili-album__watch__content">
						<img :src="majorArticle.cover" alt="专栏封面">
					</div>
				</div>
			</div>
		</div>
		
		<div class="bili-dyn-content__orig__major suit-video-card" v-if="type === 'DYNAMIC_TYPE_LIVE_RCMD' || type === 'DYNAMIC_TYPE_LIVE'">
			<a :href="live.link" class="bili-dyn-card-live rcmd hide-border">
				<div class="bili-dyn-card-live__header">
					<div class="bili-dyn-card-live__tag state--1">{{live.live_status}}</div>
					<div class="bili-dyn-card-live__cover b-img">
						<picture class="b-img__inner">
							<source type="image/avif" :srcset="live.cover.avif">
							<source type="image/webp" :srcset="live.cover.webp">
							<img :src="live.cover.webp" alt="直播封面">
						</picture>
					</div>
				</div>
				<div class="bili-dyn-card-live__body">
					<div class="bili-dyn-card-live__title bili-ellipsis fs-medium">{{live.title}}</div>
					<div class="bili-dyn-card-live__desc fs-small">{{live.area_name}} · {{live.watched_show}}</div>
				</div>
			</a>
		</div>
	</div>
<slot />
</div>`;

import { getStyle } from "../../../assets/js/utils.js";

const { defineComponent, reactive, toRefs } = Vue;

export default defineComponent( {
	name: "Dynamic",
	template,
	props: {
		dynamic: Object,
		type: String
	},
	setup( props ) {
		const state = reactive( {
			type: props.type,
			rich_text_nodes: props.dynamic.desc && props.dynamic.desc.rich_text_nodes,
			majorItems: [],
			majorClass: "",
			majorArchive: {
				cover: ""
			},
			majorArticle: {
				cover: "",
				title: "",
				desc: ""
			},
			live: {
				title: "",
				link: "",
				live_status: "",
				area_name: "",
				watched_show: "",
				cover: {
					avif: "",
					webp: ""
				}
			}
		} );
		switch ( props.type ) {
			case 'DYNAMIC_TYPE_DRAW':
				const major = props.dynamic.major;
				let drawItems;
				if ( major.type === 'MAJOR_TYPE_OPUS' ) {
					drawItems = major.opus.pics;
					state.rich_text_nodes = major.opus.summary.rich_text_nodes;
				} else {
					drawItems = major.draw.items;
				}
				const count = drawItems.length;
				switch ( count ) {
					case 1:
						state.majorClass = "one";
						break;
					case 2:
					case 3:
						state.majorClass = "grid3";
						break;
					case 4:
						state.majorClass = "grid4";
						break;
					case 5:
					case 6:
						state.majorClass = "grid6";
						break;
					case 7:
					case 8:
					case 9:
					default:
						state.majorClass = "grid9"
				}
				state.majorItems = drawItems.map( item => {
					let url;
					if ( count > 1 ) {
						url = `${ item.src || item.url }@264w_264h_1e_1c.webp`
						return {
							style: {},
							url
						}
					}
					url = `${ item.src || item.url }@2072w.webp`;
					const resolveStyle = getStyle( item.width, item.height );
					const style = {
						width: `${ resolveStyle.width }px`,
						height: `${ resolveStyle.height }px`
					};
					return {
						style,
						url
					}
				} )
				break;
			
			case 'DYNAMIC_TYPE_AV':
				state.majorArchive.cover = `${ props.dynamic.major.archive.cover }@472w_264h_1c.webp`
				break;
			
			case 'DYNAMIC_TYPE_ARTICLE':
				const major_ = props.dynamic.major;
				if ( major_.type === 'MAJOR_TYPE_OPUS' ) {
					const pics = major_.opus.pics;
					const cover = pics && pics.length > 0 ? pics[0].url : "";
					state.majorArticle.cover = cover ? `${ cover }@2072w.webp` : "";
					state.majorArticle.title = major_.opus.title;
					state.majorArticle.desc = major_.opus.summary.text;
					break;
				}
				const covers = props.dynamic.major.article.covers;
				const cover = covers && covers.length > 0 ? covers[0] : "";
				state.majorArticle.cover = cover ? `${ cover }@2072w.webp` : "";
				state.majorArticle.title = props.dynamic.major.article.title;
				state.majorArticle.desc = props.dynamic.major.article.desc;
				break;
			case 'DYNAMIC_TYPE_LIVE_RCMD':
				const live = JSON.parse( props.dynamic.major.live_rcmd.content );
				state.live = {
					title: live["live_play_info"].title,
					link: "https:" + live["live_play_info"].link,
					live_status: live["live_play_info"].live_status === 1 ? "直播中" : "直播已结束",
					area_name: live["live_play_info"].area_name,
					watched_show: live["live_play_info"].watched_show.text_large,
					cover: {
						avif: `${ live["live_play_info"].cover }@472w_264h_1c_!web-dynamic.avif`,
						webp: `${ live["live_play_info"].cover }@472w_264h_1c_!web-dynamic.webp`
					}
				};
				break;
			case 'DYNAMIC_TYPE_LIVE':
				state.live = {
					title: props.dynamic.major.live.title,
					link: "https:" + props.dynamic.major.live.jump_url,
					live_status: props.dynamic.major.live.badge.text,
					area_name: props.dynamic.major.live.desc_first,
					watched_show: props.dynamic.major.live.desc_second,
					cover: {
						avif: `${ props.dynamic.major.live.cover }@472w_264h_1c_!web-dynamic.avif`,
						webp: `${ props.dynamic.major.live.cover }@472w_264h_1c_!web-dynamic.webp`
					}
				};
				break;
			case 'DYNAMIC_TYPE_WORD':
				const maj = props.dynamic.major;
				if ( maj.type === 'MAJOR_TYPE_OPUS' ) {
					state.rich_text_nodes = maj.opus.summary.rich_text_nodes;
				}
				break;
		}
		return { ...toRefs( state ) };
	}
} )