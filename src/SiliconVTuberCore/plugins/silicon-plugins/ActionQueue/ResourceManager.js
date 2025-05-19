import CozeTtsBot from './TTS/TtsBot.vue'; // use coze tts bot
import GptSovits from './TTS/GptSovits.vue'; // use local Gpt-SoVITS
import AudioBank from './AudioBank.js';

function delay(ms) {
    if (ms <= 0) {
        return Promise.resolve(0);
    }

    return new Promise((resolve) => {setTimeout(() => {
        resolve(0);
    }, ms)});
}

/**
 * 资源
 * @param {number} id the id of resource (must be unique)
 * @param {string }type type of resource
 * @param {object} data data of resource
 */
export class Resource {
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

/**
 * 资源管理器 
 * @param ttsConfig TTS配置
 * @param translationConfig 翻译配置 (可选)
 */
export default class ResourceManager {
    constructor(ttsConfig, translationConfig = null) {
        this.ttsConfig = ttsConfig;
        this.translationConfig = translationConfig;

        this.audioBank = new AudioBank();

        this.resourceBank = {};
        this.resourceIds = [];

        this.timeoutId = null;
        this.mainLoop();

        if (ttsConfig.type === 'coze') {
            this.ttsHelper = new CozeTtsBot(ttsConfig.pat, ttsConfig.botID, 'tts_user_id'); // coze
        } else if (ttsConfig.type === 'gptsovits') {
            let cfg;
            if (ttsConfig.character === 'misaka-ja') {
                cfg = {
                    "refer_wav_path": "misaka-ref2.wav",
                    "prompt_text": "何かありそうね。クロコに連絡しておこうかな。なんだか騒がしいわね。",
                    "prompt_language": "ja",
                    "text_language": "ja",
                    "temperature": 1.0,
                    "speed": 1.0,
                    "text": "",
                };
            } else if (ttsConfig.character === 'misaka-zh') {
                cfg = {
                    "refer_wav_path": "misaka-ref2.wav",
                    "prompt_text": "何かありそうね。クロコに連絡しておこうかな。なんだか騒がしいわね。",
                    "prompt_language": "ja",
                    "text_language": "zh",
                    "temperature": 1.0,
                    "speed": 1.0,
                    "text": "",
                };
            }
            console.log('RM cfg:', cfg);
            this.ttsHelper = new GptSovits('http://127.0.0.1:9880', cfg); // gptsovits
            this.ttsHelper.setup(); // 初始化
        }

        if (!translationConfig) return;
        this.enableTranslation = translationConfig.enableTranslation;
        if (this.enableTranslation) {
            this.translator = translationConfig.translator;
            if (!this.translator) {
                console.warn("[ResourceManager] To enable translation, you need to assign translationConfig.translator!");
                this.enableTranslation = false;
            }
        }
    }

    /**
     * get resource by id
     * @param {number} id 资源的 id
     * @returns {Resource}
     */
    get(id) {
        return this.resourceBank[`resource-${id}`];
    }

    /**
     * 注册资源对象
     * @param {Resource} resource 资源对象
     */
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

        for (let id of this.resourceIds) {
            let resource = this.get(id);
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

        if (resource.type === 'TTS') { // 语音合成

            // const TTS_BREAK_TIME = 100; // (ms)
            const TTS_BREAK_TIME = 0; // skip delaying
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
        } else if (resource.type === 'Translation') { // 字幕翻译
            if (this.enableTranslation) {
                resource.data.translation = await this.translator.translate(resource.data.text);
            }
        }

        resource.requesting = false;
        resource.ready = true;
    }

    /**
     * 播放音频，并等待直到播放结束
     * @param {Resource} resource TTS 类型的资源
     * @param {boolean} instantDelete 是否在播放结束后立即删除音频
     */
    async playAudio(resource, instantDelete = false) {
        if (!resource.ready) return;

        var callback = null;

        // instantDelete = false; // [debug]
        if (instantDelete) callback = (audioBank, url) => {audioBank.remove(url)};
        await this.audioBank.play(resource.url, callback);
    }

    /**
     * 清空所有已注册的资源
     */
    clearResources() {
        this.audioBank.clearAudios();
        // for (let id of this.resourceIds) this.resourceBank[id] = undefined;
        this.resourceBank = {};
        this.resourceIds = [];
    }
}