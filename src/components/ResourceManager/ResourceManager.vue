<script>
import CozeTtsBot from './TTS/TtsBot.vue'; // use coze tts bot
import GptSovits from './TTS/GptSovits.vue'; // use local Gpt-SoVITS

function delay(ms) {
    if (ms <= 0) {
        return Promise.resolve(0);
    }

    return new Promise((resolve) => {setTimeout(() => {
        resolve(0);
    }, ms)});
}

export class Resource {
    /**
     * 
     * @param id [Number] the id of resource (must be unique)
     * @param type [String] type of resource
     * @param data [Object] data of resource
     */
    constructor(id, type, data) {
        this.id = id;
        this.type = type;
        this.data = data;
        this.ready = false;
    }

    stringify() {
        return `Resource {id: ${this.id}, type: ${this.type}, ready: ${this.ready}, data: ${this.data}}`;
    }
}

export default class ResourceManager {
    constructor(parent, audioBank, helperName = 'gptsovits') {
        this.parent = parent; // gain access to Bot Core
        this.audioBank = audioBank;

        this.resourceBank = {};
        this.resourceIds = [];

        this.timeoutId = null;
        this.mainLoop();

        if (helperName === 'coze') {
            this.ttsHelper = new CozeTtsBot(this.parent.ttsPat, this.parent.ttsBotID, 'tts_user_id'); // coze
        } else {
            this.ttsHelper = new GptSovits(); // gptsovits
        }

        this.ttsHelper.setup(); // 初始化
    }

    get(id) {
        return this.resourceBank[`resource-${id}`];
    }

    add(resource) {
        let id = resource.id;
        this.resourceBank[`resource-${id}`] = resource;
        this.resourceIds.push(id);
    }

    remove(id) {
        this.resourceBank[`resource-${id}`] = undefined;
        this.resourceIds.splice(this.resourceIds.indexOf(id), 1);
    }

    async mainLoop() { // main loop

        const INTERVAL = 100; // interval time (ms)

        // let str = '';
        // for (let id of this.resourceIds) {
        //     str += this.get(id).stringify();
        // }
        // console.log(`ResourceManager mainLoop alive! ${str}`);

        for (let id of this.resourceIds) {
            let resource = this.get(id);
            // if ((!resource.ready) && (!resource.requesting)) {
            if (!resource) {
                console.warn(`undefined resource (id: ${id})`);
                continue;
            }

            if (!resource.ready) {
                await this.requestFor(resource);
            }
        }
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(async() => {await this.mainLoop()}, INTERVAL);
    }

    async requestFor(resource) {
        resource.requesting = true;

        if (resource.type === 'TTS') {

            const TTS_BREAK_TIME = 100; // (ms)
            if (!this.prevTtsBreakTime) this.prevTtsBreakTime = Date.now();
            await delay(TTS_BREAK_TIME - (Date.now() - this.prevTtsBreakTime)); // prevent too frequent tts requests

            let text = resource.data.text;
            let ttsHelper = this.ttsHelper;
            try {
                let audioUrl = await ttsHelper.generateAudio(text);
                resource.url = audioUrl;
                if (resource.url) {
                    this.audioBank.add(audioUrl);
                } // 若url为null，则不添加该audio
            } catch(e) {
                console.warn("An error occurred when requesting for a TTS resource.", `TTS text: "${text}"`, e);
                resource.url = null; // TTS生成失败，直接不再播放这句
            }
        }

        resource.requesting = false;
        resource.ready = true;
    }

    async playAudio(resource, instantDelete = false) {
        if (!resource.ready) return;

        var callback = null;

        // instantDelete = false; // [debug]
        if (instantDelete) callback = (audioBank, url) => {audioBank.remove(url)};
        await this.audioBank.play(resource.url, callback);
    }

    clearResources() {
        this.audioBank.clearAudios();
        // for (let id of this.resourceIds) this.resourceBank[id] = undefined;
        this.resourceBank = {};
        this.resourceIds = [];
    }
}

</script>