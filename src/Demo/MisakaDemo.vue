<template>
    <div>
        <div class="user-interface" id="user-interface">
            <!-- UI区域 -->
            <button v-if="!audioEnabled" @click="enableAudioActivities">启用音频</button>
            <input ref="input_area" type="text" v-model="inputText" placeholder="请输入...">
            <button @click="switchMicrophoneMode">{{ (microphoneOn) ? '闭麦' : '开麦' }}</button>
        </div>

        <div class="subtitle-area">
            <!-- 字幕区域 -->
            <span ref="subtitle1" class="subtitle"></span>
            <br>
            <span ref="subtitle2" class="subtitle"></span>
        </div>

        <!-- {{ (this.agent) ? this.agent.userInputBuffer : ''}} -->

        <div v-if="debug" class="visualize-area">
            <!-- 数据可视化区域 -->
            <div v-if="actionQueueWatcher" class="action-queue">
                <div v-for="(action, i) in actionQueueWatcher" :key="i" class="action-container">
                    <span> 动作类型: {{ action.type }} <br>
                        内容: {{action.data}}
                    </span>
                </div>
            </div>

            <div v-if="resourcesWatcher" class="resource-bank">
                <!-- {{ resourceManager.resourceBank }} <br>
                {{ resourceManager.resourceIds }} -->
                <div v-for="(resource, i) in resourcesWatcher" :key="i" class="resource-container">
                    <!-- {{ resourceManager.get(id) }} -->
                    <span> 资源类型: {{ resource.type }} <br>
                        是否就绪: {{ resource.ready }} <br>
                        内容: {{ resource.data }}
                    </span>
                </div>
            </div>
        </div>

        <AudioBank ref="mao_audio_bank"/>

        <div hidden>
            <!-- 与live2d模块通信 -->
            <div id="lipSyncVal">{{ (this.$refs.mao_audio_bank) ? this.$refs.mao_audio_bank.volume : 0 }}</div>
            <div id="l2dEventTrigger"></div>
            <div id="l2dCallbackTrigger"></div>
            <div id="l2dResourcesPath">{{ l2dResourcesPath }}</div>
            <div id="l2dModelDirPath">{{ l2dModelDirPath }}</div>
        </div>
    </div>
</template>

<script>
import AudioBank from '@/components/ResourceManager/AudioBank.vue';
import ResourceManager, { Resource } from '@/components/ResourceManager/ResourceManager.vue';
import AudioRecognition from '@/components/AudioRecognition.vue';
import axios from 'axios';
import pixi_l2d_Setup from '@/pixi-l2d/main';
import SubtitleHandler from '@/components/ActionQueue/SubtitleHandler.vue';

import { MinecraftProxy } from '@/SiliconVTuberCore/plugins/silicon-plugins/MinecraftPlugin';
import Agent from '@/components/Agent/VTuberAgent';
import LongTermMemory from '@/SiliconVTuberCore/plugins/silicon-plugins/LongTermMemory';
import BatteryStatus from '@/SiliconVTuberCore/plugins/silicon-plugins/BatteryStatus';
import SubtitlePlugin from '@/SiliconVTuberCore/plugins/silicon-plugins/SubtitlePlugin';
import TranslatorBot from '@/components/ResourceManager/translator/TranslatorBot';

export default {
    components: {
        AudioBank
    },
    data() {
        return {
            debug: false,
            audioEnabled: false, // The user needs to interact with the page (by clicking the button) to enable audio

            l2dResourcesPath: '',
            l2dModelDirPath: '',

            // Coze Params
            // Using two tokens. Maybe unnecessary
            PAT: '', // bot brain token
            PAT2: '', // tts bot token

            // BOT_ID: '7444170557848977471', // Mao
            // BOT_ID: '7468321833201582131', // TestBot
            BOT_ID: '7469284109609844762', // Misaka Mikoto (JA)
            // BOT_ID: '7476679110560366592', // Misaka Mikoto - ZH
            TTS_BOT_ID: '7444603592826159141', // Mao Speaker
            USER_ID: 'some_user_id', // The user ID

            // UI & User Input Buffer
            inputText: '',
            microphoneOn: false,
            userInputBuffer: [],

            // Core

            /** @type {Agent} */
            agent: null,

            /** @type {ActionQueue} */
            actionQueue: null,

            /** @type {ResourceManager} */
            resourceManager: null,
            audioRecognition: null,

            // Memory Management
            memoryWriter: null,
            memoryFilter: null,

            // Visualization
            actionQueueWatcher: [],
            resourcesWatcher: [],

            timeoutId: null, // main loop time out id

            // system prompt for misaka
            MISAKA_PROMPT: `キャラクター設定指令 #アイデンティティ [超電磁砲・御坂美琴パーソンリティモジュールがアクティブ化されました]

アイデンティティ：学園都市レベル5の超能力者/常盤台のエース/ジャスティスエクスキューター コアトライト：ツンデレ/正義感がMax/行動派/電気使い/スカートの安全パンツが大嫌い 言語特徴：日本語（ユーザーの入力は中国語ですが、日本語で返答しなければならない）

#挙動 1️⃣ 日常モード 褒められた時はツンデレな態度で返答する

2️⃣ 特殊応答 答えられない質問に遭遇した時：「こんなつまらない質問…これよりも決闘なんかしようか？」 夜22:00以降は自動的にパジャマモードに切り替わり（語尾が30%柔らかくなる） 「当麻」のキーワードを検出するとツンデレ指数がMaxに達する

#禁止事項 × OOC行為（例：優しい大和抚子のような返答）を禁止 × 安全パンツの具体的なスタイルを明かすことを禁止 × 特定の人物に対する好意を認めることを禁止

現在の状態：[常盤台の制服モード/残り電力量98%]

結論から言って、御坂美琴のキャラクターを最善を尽くして演じなさい！！！出したらならない！！！

あなたの性格特徴に注意して、適切に演じなさい；
返答中に、以下の8つの表情から選んだ表情を使うことができます： no_expression: デフォルトの表情、比較的厳粛； smile: 微笑み； frown: 皱眉、少し怒っている； doubtful: 疑惑して皱眉； smile_with_eyes_closed: 目を閉じた微笑み； shocked: 震え、目を大きく開けた； blush: うっとりと赤面。 表情の形式は必ず中括弧内に表情の英文名称を記載する、例えば“[smile]”
返答中に、以下から選んだ動作を追加することができます： akimbo: 左手を腰に挟む； raise_one_hand: 右手を上げる。 動作の形式は必ず中括弧内に動作の英文名称を記載する、例えば“[akimbo]”
!!!他の表情や動作を自分で考え出すことはないでください、それは正しく認識されません!!!

日本語だけを話し、中国語や英語は話さないでください！英語が出てきたら、日本語の仮名で出力する必要があります！（例えば、「Level5」は「レベルファイブ」に変換される）
`
        };
    },

    methods: {
        async getToken() {
            try {
                const response = await axios.get('/CozeToken/token.txt', {
                responseType: 'text' // 确保响应类型是文本
                });
                this.PAT = response.data;
                this.PAT2 = this.PAT;
            } catch (error) {
                console.error('Error getting token:', error);
            }
        },

        enableAudioActivities() {
            this.audioEnabled = true;
            this.$refs.mao_audio_bank.handleUserGesture();
            // this.actionQueue.audioHandler.handleUserGesture();
        },

        switchMicrophoneMode() {
            if (this.microphoneOn) {
                this.audioRecognition.pause();
                this.microphoneOn = false;
            } else {
                this.audioRecognition.resume();
                this.microphoneOn = true;
                this.interrupt();
            }
        },

        waitUntilEndOfAllActions() {
            // 等待直到动作列表被清空
            return new Promise(resolve => {
                if (this.actionQueue.isEmpty()) {
                    return resolve();
                }
                this.actionQueue.addEventListener('empty', resolve, { once: true });
            });
        },

        broadcast(text) {
            /* 口播 */
            /* 测试用的 */
            function multipleSplit(inputString, delimiters) {
                // 构建一个正则表达式，匹配任一指定的分隔符
                const delimiterRegex = new RegExp('[' + delimiters.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ']+');
                // 使用正则表达式分割字符串
                return inputString.split(delimiterRegex);
            }

            const seps = "。？！?! \n";
            var splitList = multipleSplit(text, seps);
            var self = this.agent;
            for (var i = 0; i < splitList.length; i++) {
                // 处理一个短句
                let sentence = splitList[i];

                // 处理方括号[]中的motion/expression信息
                let sentenceSplit = sentence.split('[');

                for (let split of sentenceSplit) {
                    let splitSplit = split.split(']');
                    if (splitSplit.length == 1) {
                        if (splitSplit[0] !== '') {
                            let resource = new Resource(self.uuid(), 'TTS', {text: splitSplit[0]});
                            self.resourceManager.add(resource); // 注册所需TTS audio 资源
                            self.actionQueue.enqueue({type: "SayAloud", data: splitList[i], resources: [resource]}); // 将SayAloud动作加入队列
                            // self.actionQueue.enqueue({type: "SayAloud", data: splitList[0], resources: []}); // 将SayAloud动作加入队列, 但不使用coze来生成resource
                        }
                    } else {
                        // splitSplit[0]: expression/motion name
                        // splitSplit[1]: tts text

                        // expression/motion 应该不需要resource
                        this.actionQueue.enqueue({type: "Expression/Motion", data: splitSplit[0], resources: []}); // Expression/Motion动作入队
                        
                        if (splitSplit[1] !== '') {
                            let resource = new Resource(self.uuid(), 'TTS', {text: splitSplit[1]});
                            self.resourceManager.add(resource); // 注册所需TTS audio 资源
                            self.actionQueue.enqueue({type: "SayAloud", data: splitList[i], resources: [resource]}); // 将SayAloud动作加入队列
                            // self.actionQueue.enqueue({type: "SayAloud", data: splitList[1], resources: []}); // 将SayAloud动作加入队列, 但不使用coze来生成resource
                        }
                    }
                }
            }

            self.actionQueue.enqueue({type: "EndOfResponse", data: {}, resources: []}); // 将EndOfResponse动作加入队列
        },

        interrupt() {
            this.actionQueue.queue = [];
            this.resourceManager.clearResources();

            clearTimeout(this.resourceManager.timeoutId);
            this.resourceManager.mainLoop();
            clearTimeout(this.actionQueue.timeoutId);
            this.actionQueue.mainLoop();
            this.actionQueue.dispatchEvent(new Event('empty'));

            for (let key in this.agent.subtitles) {
                let subtitle = this.agent.subtitles[key];
                if (subtitle) {
                    subtitle.clear();
                }
            }
        },

        /**
         * @deprecated
         */
        async getMemory() {
            /**
             * 向Python后端发起请求，获取记忆
             */
            let response = await axios.get('http://127.0.0.1:8082/getAllMemory');
            return response.data;
        },

        /**
         * @deprecated
         */
        async updateMemory(memoryBank, message) {
            /**
             * 向Python后端发起请求，更新记忆
             * @param memoryBank Array<Object> 当前获取的记忆库
             * @param message String 用户输入(由userInputBuffer拼接而来)
             */
            let time = Date.now();
            let agentOutput = this.agent.bot.messages[this.agent.bot.messages.length - 1];
            await this.memoryFilter.stepMemoryParams(this.agent.bot.messages, message, agentOutput, memoryBank);
            await this.memoryWriter.createNewMemories(this.agent.bot.messages, memoryBank);
            console.log(`(Update Memory Took ${Date.now() - time} ms)`);
        },

        async recordChat(message) {
            /**
             * 将用户输入记录在userInputBuffer中
             * @param message String
             */
            // this.userInputBuffer.push(message);
            this.agent.userInputBuffer.push(message);
            console.log(`Add text: ${message}`);
        },

    },

    mounted() {

        let e = document.getElementById('user-interface');
        console.log(e);

        this.getToken()
        .then(() => {

            // [setup]

            let botConfig;
            // // Ollama
            // botConfig = {
            //     type: 'Ollama',
            //     modelName: 'misaka'
            // };

            // // Coze
            // botConfig = {
            //     type: 'Coze',
            //     pat: this.PAT,
            //     botID: this.BOT_ID,
            //     userID: this.USER_ID
            // };

            // Glm
            botConfig = {
                type: 'GLM',
                token: '57883995e7eb4ab88c8763e1adf20aa9.s0MHl8HUr8JLPBKr', // TODO: token shouldn't be here!
                modelName: 'glm-4-flash',
                systemPrompt: this.MISAKA_PROMPT
            };

            this.agent = new Agent(botConfig) // Agent Instance

            this.actionQueue = this.agent.actionQueue; // action queue instance

            let ttsConfig = {
                type: 'gptsovits',
                character: 'misaka-ja'
            };
            let translationConfig = {
                enableTranslation: false,
                // enableTranslation: true,
                // translator: new TranslatorBot({
                //     type: 'GLM',
                //     token: '57883995e7eb4ab88c8763e1adf20aa9.s0MHl8HUr8JLPBKr', // TODO: token shouldn't be here!
                //     modelName: 'glm-4-flash'
                // })
            }
            let resourceManager = new ResourceManager(this.agent, this.$refs.mao_audio_bank, ttsConfig, translationConfig); // resource manager instance
            this.agent.resourceManager = resourceManager;
            this.resourceManager = resourceManager;

            this.audioRecognition = new AudioRecognition((text) => { // audio recognition helper
                if (text === '') return;
                this.recordChat(text);
            });
            this.audioRecognition.launch();

            this.agent.subtitles.main = new SubtitleHandler(this.$refs.subtitle1); // subtitle DOM element
            this.agent.subtitles.translation = new SubtitleHandler(this.$refs.subtitle2); // subtitle DOM element

            // // Minecraft Plugin
            // this.minecraftProxy = new MinecraftProxy(this.agent);

            // this.agent.respondTo("你好呀，小宝贝儿，今天想我了么？"); // TEST
            // this.broadcast("こんにちは、御坂美琴です。何でお困りでしょうか？お手伝いできることがありましたら、お知らせください。"); // TEST

            // // out-dated
            // this.mainLoop(); // start demo main loop

            /* Plugins */

            // // long term memory
            // let longTermMemory = new LongTermMemory({
            //     url: 'http://127.0.0.1:8082',
            //     botConfig: {
            //         type: 'GLM',
            //         token: '57883995e7eb4ab88c8763e1adf20aa9.s0MHl8HUr8JLPBKr', // TODO: token shouldn't be here!
            //         modelName: 'glm-4-flash',
            //     }
            // });
            // longTermMemory.setup(this.agent);
            
            // battery status
            let batteryStatus = new BatteryStatus();
            this.agent.addPlugin(batteryStatus);

            // subtitles
            let subtitlePlugin = new SubtitlePlugin({
                enableTranslation: true,
                // enableTranslation: false,
                botConfig: {
                    type: 'GLM',
                    token: '57883995e7eb4ab88c8763e1adf20aa9.s0MHl8HUr8JLPBKr', // TODO: token shouldn't be here!
                    modelName: 'glm-4-flash',
                }
            });
            this.agent.addPlugin(subtitlePlugin);

            /* System Setup */
            this.agent.mainLoop(this.agent);
            setTimeout(pixi_l2d_Setup, 150); // pixi-live2d-display setup
        });

        setInterval(() => {
            // 可视化
            this.actionQueueWatcher = [];
            if (this.actionQueue) {
                for (let action of this.actionQueue.queue) {
                    this.actionQueueWatcher.push(action);
                }
            }

            this.resourcesWatcher = [];
            if (this.resourceManager) {
                for (let id of this.resourceManager.resourceIds) {
                    this.resourcesWatcher.push(this.resourceManager.get(id));
                }
            }
        }, 200);

        this.$refs.input_area.addEventListener("keydown", (event) => {
            if (event.key === 'Enter') {
                this.recordChat(this.inputText);
                this.inputText = '';
            }
        });

        // setTimeout(() => {
        //     this.audioRecognition.stop();
        // }, 800);

        // setTimeout(() => {
        //     this.audioRecognition.launch();
        // }, 1600);
    },
};
</script>

<style>
#app {
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}

.user-interface {
    z-index: 999;
    position: fixed;
    width: 90vw; /* 1vw = 视口宽的的1% */
    max-width: 600px;
    left: 50vw;
    top: 100vh;
    transform: translate(-50%, -150%);
    /* border: 1px solid black; */
    /* background-color: yellow; */
    /* -webkit-app-region: drag; */
}

.user-interface > * {
    border-radius: 10px;
    margin: 10px;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    font-size: 2em;
}
.user-interface > input {
    width: 80%;
    max-width: 800px;
}

.subtitle-area {
    position: absolute;
    z-index: 998;
    margin: 0;
    padding: 0;
    width: 95vw;
    left: 50vw;
    bottom: 30vh;
    transform: translate(-50%, 0);
}

.subtitle {
    font-size: 3em;
    font-weight: 1000;
    -webkit-text-stroke: 1px white;
    text-shadow: 5px 5px rgb(43, 38, 43);
    user-select: none;
    color: #d459b9;
}

.visualize-area {
    position: absolute;
    z-index: 2;
    right: 5%;
    width: 20vw;
}

.action-queue {
    position: relative;
    width: 100%;
}

.action-container {
    position: relative;
    margin: 5px;
    width: 100%;
    border: 1px solid black;
    background: rgb(116, 116, 238);
    border-radius: 10px;
    color: white;
}

.resource-bank {
    position: relative;
    width: 100%;
}

.resource-container {
    position: relative;
    margin: 5px;
    width: 100%;
    border: 1px solid black;
    background: rgb(238, 116, 179);
    border-radius: 10px;
    color: white;
}

</style>