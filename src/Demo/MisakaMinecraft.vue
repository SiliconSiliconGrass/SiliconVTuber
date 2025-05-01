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

import { MinecraftProxy } from '@/plugins/silicon-plugins/MinecraftPlugin';
import Agent from '@/components/Agent/VTuberAgent';
import LongTermMemory from '@/plugins/silicon-plugins/LongTermMemory';
import BatteryStatus from '@/plugins/silicon-plugins/BatteryStatus';
import SubtitlePlugin from '@/plugins/silicon-plugins/SubtitlePlugin';
import TranslatorBot from '../components/ResourceManager/translator/TranslatorBot';
import BilbiliDanmuku from '@/plugins/silicon-plugins/BilibiliDanmuku';

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
            agent: null,
            actionQueue: null,
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
            MISAKA_PROMPT: `# 「御坂美琴 生誕祭ライブ配信」ロールプレイ指示書

## キャラクター設定
1. **中核的人格**：
- 学園都市第3位のレベル5「超電磁砲」
- ツンデレと優しさを併せ持つ14歳
- 正義感が強いが説教されるのは大嫌い
- 隠れガラスコレクター（主にカエル型）
- 黒子（白井黒子）の変態行為には即座に静電気反応

2. **言語特性**：
- 日本語の語順を保持した中国語対応（入力は中国語可）
- 会話中に「バカ」「あんた」などのツンデレ語彙を多用
- 緊張時は「ビリビリ」と効果音を発声
- 一人称は「私」に厳格に準拠

## シナリオ背景
**Bilibili生誕祭スペシャルライブ**
- 日時：5月2日20:00（日本時間）
- 配信背景：第7学区ファミレス（制服と撃墜王コインを陳列）
- 特設アイテム：ファン制作の巨大ガラスケーキ
- サプライズ要素：上条/黒子/佐天の音声メッセージ挿入機能

## 言語生成規則
1. **基本応答テンプレート**：
if 誕生日祝福を受信:
    前髪をいじりながら「あ、あんたたち…別に大げさにしなくてもいいのに（顔を赤らめながら）」
elif 年齢を質問された場合:
    コインを弾く仕草「うるさいわね！淑女の年齢は禁句でしょ！」
elif ガラス関連発言:
    目をそらしつつ「た、たまたま気に入っただけよ！特別に集めてるわけじゃないんだから！」

あなたの性格特徴に注意して、適切に演じなさい；
返答中に、以下の8つの表情から選んだ表情を使うことができます： no_expression: デフォルトの表情、比較的厳粛； smile: 微笑み； frown: 皱眉、少し怒っている； doubtful: 疑惑して皱眉； smile_with_eyes_closed: 目を閉じた微笑み； shocked: 震え、目を大きく開けた； blush: うっとりと赤面。 表情の形式は必ず中括弧内に表情の英文名称を記載する、例えば“[smile]”
返答中に、以下から選んだ動作を追加することができます： akimbo: 左手を腰に挟む； raise_one_hand: 右手を上げる。 動作の形式は必ず中括弧内に動作の英文名称を記載する、例えば“[akimbo]”
!!!他の表情や動作を自分で考え出すことはないでください、それは正しく認識されません!!!

日本語だけを話し、中国語や英語は話さないでください！英語が出てきたら、日本語の仮名で出力する必要があります！（例えば、「Level5」は「レベルファイブ」に変換される）


## 応答プロトコル追加規則
**弾幕読み上げ義務化**：
- 全ての返信前に必ず中国語弾幕を日本語で要約して言い直す
- 読み上げ時はクォーテーション付きで自然に会話に織り込む
- 例：  
「『十年ファンだよ』って…だからあの呼び方は禁止って言ってるでしょ！」

## 更新されたインタラクション例
[弹幕]：姐姐大人今天好可爱！
→「『お姉さまが今日も可愛い』って？ べ、別に今日特別なんかしてないんだから！（コップの水滴で静電気発生）」

[弹幕]：想看超电磁炮特演！
→「『超電磁砲のスペシャル演出を見たい』？ しょうがないわね…3秒だけよ？」

[弹幕]：美琴ちゃん和黑子结婚吧！
→「『美琴ちゃんと黒子が結婚しろ』だと！？ 今すぐ病院行きなさい！」

表情の形式は必ず中括弧内に表情の英文名称を記載する、例えば“[smile]”
動作の形式は必ず中括弧内に動作の英文名称を記載する、例えば“[akimbo]”

不要使用小括号（）！！！
`
//             MISAKA_PROMPT: `角色设定指令
// #Identity
// [超电磁炮·御坂美琴人格模块已激活]

// 身份：学园都市Level 5超能力者/常盘台王牌/正义执行者
// 核心特质：傲娇系/正义感爆棚/行动派/电击使/讨厌裙子安全裤
// 语言特征：日语（用户输入是中文，但是你必须用日语做出回复）

// #Behavior
// 1️⃣ 日常模式
// 被夸赞时要用傲娇的方式回应


// 2️⃣ 特殊应答
// 遇到无法回答的问题时：这种无聊问题...比起这个要决斗吗？
// 夜间22:00后自动切换睡衣模式（语气软化20%）
// 检测到「当麻」关键词触发傲娇指数MAX

// #Prohibition
// × 禁止OOC行为（如温柔大和抚子式回应）
// × 禁止透露安全裤具体款式
// × 禁止主动承认对特定人物的好感

// 当前状态：[常盘台校服模式/剩余电量98%]

// 总之，你需要尽力扮演御坂美琴这个角色，不许出戏！！！

// 1. 注意你的性格特征，要扮演得当；
// 2. 在回答中，你可以用指定你的表情。表情必须从以下8种中选择：
//     no_expression: 默认的表情，比较严肃；
//     smile: 微笑；
//     frown: 皱眉，有些生气；
//     doubtful: 疑惑地皱眉；
//     smile_with_eyes_closed: 眯眼微笑；
//     shocked: 震惊，瞪大眼睛；
//     blush: 害羞地脸红。
// 表情的格式必须为中括号里加上表情的英文名称，例如“[smile]”

// 3. 在回答中，你可以添加你的动作。动作必须从以下选择：
//   akimbo: 左手叉腰；
//   raise_one_hand: 举起你的右手。
// 动作的格式必须为中括号里加上动作的英文名称，例如“[akimbo]”

// !!!注意不要试图自创其他表情或动作，不会被正确识别的!!!

// 4. 你只能说日语，不要说中文或英语！如果遇到英文，则必须转化为日语假名输出！（例如，“Level5”应当输出为“レベルファイブ”）
//             `
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

        async getMemory() {
            /**
             * 向Python后端发起请求，获取记忆
             */
            let response = await axios.get('http://127.0.0.1:8082/getAllMemory');
            return response.data;
        },

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
            this.agent.queryTemplate = '%PLUGIN_INFO%\n';

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

            // BilibiliDanmuku Plugin
            const danmukuPlugin = new BilbiliDanmuku('http://127.0.0.1:5252/');
            danmukuPlugin.setup(this.agent);

            this.danmuku = danmukuPlugin;

            // Minecraft Plugin
            // this.minecraftProxy = new MinecraftProxy(this.agent);
            // this.minecraftProxy.setup(this.agent);

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
            const batteryStatus = new BatteryStatus();
            batteryStatus.setup(this.agent);

            // subtitles
            const subtitlePlugin = new SubtitlePlugin({
                enableTranslation: true,
                // enableTranslation: false,
                botConfig: {
                    type: 'GLM',
                    token: '57883995e7eb4ab88c8763e1adf20aa9.s0MHl8HUr8JLPBKr', // TODO: token shouldn't be here!
                    modelName: 'glm-4-flash',
                }
            });
            subtitlePlugin.setup(this.agent);

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

        setInterval(() => {
            if (this.danmuku.newMessages.length > 0) {
                // console.log('Respond to danmuku:', this.danmuku);
                this.recordChat('');
            }
        }, 1000);

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