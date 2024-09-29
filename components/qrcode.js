const template = `<div class="qrcode_main">
<div class="left">
	<img src="/hot-news/assets/img/bili_logo.png" alt="logo" class="bili_logo"/>
	<div>
		<p style="font-size: 18px;">长按识别二维码即可查看全文</p>
		<p>分享于 {{create_time}}</p>
	</div>
</div>
<div class="right">
	<div ref="qrcode" class="qrcode"></div>
</div>
</div>`

import { toHumanize } from "../assets/js/utils.js";

const { defineComponent, ref, onMounted, computed } = Vue;

export default defineComponent( {
	name: "QRCode",
	template,
	components: {},
	props: {
		url: {
			type: String,
			default: ""
		}
	},
	setup( props ) {
		const qrcode = ref( null );
		const create_time = computed( () => {
			const timestamp = Date.now();
			return toHumanize( timestamp, 3 );
		} );
		onMounted( () => {
			new QRCode( qrcode.value, {
				text: props.url,
				width: 80,
				height: 80,
				colorDark: '#000000',
				colorLight: '#ffffff',
				correctLevel: QRCode.CorrectLevel.H,
			} );
		} )
		return {
			qrcode,
			create_time
		}
	}
} );