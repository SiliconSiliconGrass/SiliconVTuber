<script>
import CozeBot from '../BotBrain/CozeBot.vue';

const msgDelta = (self, data) => {
    self.response += data['content'];
};

export default class TtsBot extends CozeBot {
    constructor(pat, botID, userID) {
        var eventCallBacks = {
            'conversation.message.delta': msgDelta,
        }
        super(pat, botID, userID, eventCallBacks);
    }

    async generateAudio(text) {
        console.log('generating audio:', text);
        return new Promise((resolve, reject) => {
            this.respondTo(text)
            .then((response) => {
                console.log(response);
                var url = JSON.parse(response).output;
                console.log(`[audio gen] text: ${text}, url: ${url}`);
                resolve(url);
            })
            .catch(e => {
                console.log('[TtsBot]: An error occurred when generating url', e);
                reject();
            });
        });
    }
}

</script>