<script>
import AbstractTtsHelper from './AbstractTtsHelper.vue';

export default class GptSovits extends AbstractTtsHelper{
    constructor(url, cfg) {
        super();

        if (!url) url = 'http://127.0.0.1:9880';
        if (!cfg) {
            cfg = {
                // "refer_wav_path": "Intro-Yui2.mov",
                // "prompt_text": "では、無丂のりちゃん、あなたにとって、ほうかごとは、きっちゃった聞いてみよう。はい、入りましたー。はいはい",

                // "refer_wav_path": "misaka-ref1.wav",
                // "prompt_text": "任務完了よ、お疲れさん。はぁ、厄介事はこれで終わりね。",

                "refer_wav_path": "misaka-ref2.wav",
                "prompt_text": "何かありそうね。クロコに連絡しておこうかな。なんだか騒がしいわね。",

                "prompt_language": "ja",
                "text_language": "ja",
                "temperature": 1.0,
                "speed": 1.0,

                "text": "",
            };
        }
        this.url = url;
        this.cfg = cfg;
    }

    setup() {
        // do nothing
    }

    // handleUserGesture() {
    //     // 确保浏览器支持 suspend 和 resume
    //     if (this.audioContext.state === 'suspended') {
    //         this.audioContext.resume().then(() => {
    //             console.log('AudioContext available!');
    //         });
    //     }
    // }

    async generateAudio(text) {

        if (text.replaceAll(' ', '') === '') { // 避免不合法的语音合成请求
            return;
        }

        console.log("GPTSOVITS 1", text);

        text = text.replaceAll('Minecraft', 'マインクラフト');
        text = text.replaceAll('minecraft', 'マインクラフト');
        text = text.replaceAll('IndexError', 'インデックスエラー');
        text = text.replaceAll('indexerror', 'インデックスエラー');

        console.log("GPTSOVITS 2", text);

        let data = this.cfg; // 这似乎不是deepcopy，请小心可能引发的问题
        data.text = text;

        let url = this.url;

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
            // 创建一个指向Blob的URL
            const audioUrl = URL.createObjectURL(blob);
            return audioUrl;

        } catch (error) {
            console.error('Fetch error:', error);
        }
    }
}

</script>