<script>
import AbstractTtsHelper from './AbstractTtsHelper.vue';

export default class GptSovitsV2 extends AbstractTtsHelper{
    constructor(url, cfg) {
        super();

        if (!url) url = 'http://127.0.0.1:9880/tts';
        console.log(cfg, !cfg);
        this.url = url;

        console.log(cfg);
        this.cfg = cfg;
    }

    setup() {
        // do nothing
    }

    async generateAudio(text) {

        if (text.replaceAll(' ', '') === '') { // 避免不合法的语音合成请求
            return;
        }

        let data = this.cfg; // 这似乎不是deepcopy，请小心可能引发的问题
        data.text = text;

        let url = this.url;
        console.log("GPTSOVITSV2", {text, url, data});

        try {
            // 使用fetch发送POST请求
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
            });

            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }

            // 获取ReadableStream
            const reader = response.body.getReader();
            const stream = new ReadableStream({
                start(controller) {
                    function push() {
                        // 读取下一个数据块
                        reader.read().then(({ done, value }) => {
                            if (done) {
                                // 如果读取完成，则关闭流
                                controller.close();
                                return;
                            }
                            // 获取数据块并将其放入流中
                            controller.enqueue(value);
                            push();
                        }).catch(error => {
                            console.error('Error reading data', error);
                            controller.error(error);
                        });
                    }
                    push();
                }
            });

            // 创建一个Blob对象，从ReadableStream中读取数据
            const blob = await new Response(stream).blob();
            if (blob.size === 0) return;
            // 创建一个指向Blob的URL
            const audioUrl = URL.createObjectURL(blob);
            console.log("GPTSOVITSV2", {text, audioUrl});
            return audioUrl;

        } catch (error) {
            console.error('Fetch error:', error);
        }
    }
}

</script>