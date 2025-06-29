<script>
import CozeBot from '@/SiliconVTuberCore/Bot/CozeBot.vue';

const msgDelta = (self, data) => {
    self.response += data['content'];
};

export default class TtsBot extends CozeBot {
    /**
     * A common TTS bot model, using coze api
     * @param pat coze token
     * @param botID coze bot id
     * @param userID coze user id (any string, except empty)
     */
    constructor(pat, botID, userID) {
        var eventCallBacks = {
            'conversation.message.delta': msgDelta,
        }
        super(pat, botID, userID, eventCallBacks);
    }

    setup() {
        this.createConv();
    }

    async generateAudio(text) {
        // console.log('generating audio:', text);
        text += '------'; // add "----" to the end of text, to prevent audio from sharp stops
        let time = Date.now();
        return new Promise((resolve) => {
            this.respondTo(text)
            .then((response) => {
                var url = JSON.parse(response).output;
                // console.log(`[audio gen] text: ${text}, url: ${url}`);
                console.log(`(TTS took ${Date.now() - time}ms)`);
                resolve(url);
            })
            .catch(e => {
                console.warn('[TtsBot]: An error occurred when generating url', e);
                resolve(null)
            });
        });
    }
}

</script>