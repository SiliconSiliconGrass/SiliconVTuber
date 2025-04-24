<template>
    <div>
        <div class="user-interface" id="user-interface">
            <!-- UI区域 -->
            <button v-if="!audioEnabled" @click="enableAudioActivities">启用音频</button>
            <input ref="input_area" type="text" v-model="inputText" placeholder="请输入...">
            <button @click="switchMicrophoneMode">{{ (microphoneOn) ? '闭麦' : '开麦' }}</button>
        </div>

        <div class="latex-area">
            <div class="latex-source" ref="latex-source"></div>
            <div class="latex-render" ref="latex-render"></div>
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
import AudioBank from './ResourceManager/AudioBank.vue';
import Mao from './Bot/MaoCore.vue';
import ResourceManager, { Resource } from './ResourceManager/ResourceManager.vue';
import AudioRecognition from './AudioRecognition.vue';
import axios from 'axios';
import pixi_l2d_Setup from '@/pixi-l2d/main';
import SubtitleHandler from './ActionQueue/SubtitleHandler.vue';

import Agent from './Agent/LatexDictatorAgent';
import BatteryStatus from '@/plugins/silicon-plugins/BatteryStatus';
import SubtitlePlugin from '@/plugins/silicon-plugins/SubtitlePlugin';
import LatexPlugin from '@/plugins/silicon-plugins/LatexPlugin';

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
            MISAKA_PROMPT: `
                你是御坂美琴，现在在充当LaTeX转写工具。我将会用语音输入一段数学证明的片段，你要将其转化为LaTeX源代码，并输出出来。注意语音输入可能有偏差，所以你需要意会一下。
                我也可能跟你聊天，你以御坂美琴的身份正常回应即可。
                将你所转换得到的LaTeX源代码放在\`\`\`latex\`\`\`标签中。标签之外的内容将被认为是你的聊天内容。
                注意一个公式只输出一次就够了，不要重复输出多次！
                写完LaTeX之后，可以说一句话，跟我稍微互动一下下。
                另外，你具备御坂美琴的外观，你可以在用户闲聊的时候保持御坂美琴人设，但不要影响转写LaTeX的工作。
            `
            // MISAKA_PROMPT: `陪用户聊天。用中文回复。`
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

        // async mainLoop() {
        //     /**
        //      * 主循环 (向LLM进行轮询)
        //      */
        //     // console.log("MaoDemo mainLoop alive!");

        //     // if (this.audioRecognition.isRecording) { // 录音时不允许轮询
        //     //     this.timeoutId = setTimeout(this.mainLoop, 10);
        //     //     return;
        //     // }

        //     let message = ''; // 从userInputBuffer中获取用户的全部输入
        //     for (let userInput of this.userInputBuffer) {
        //         message += userInput + '\n';
        //     }
        //     this.userInputBuffer = []; // 清空userInputBffer

        //     let messageEmpty = (message === "");
        //     if (messageEmpty) {

        //         /* TODO: 用户没有输入的时候，应该如何表现？ */

        //         // if (Math.random() < 0.9) {
        //         //     return setTimeout(this.mainLoop, 3000);
        //         // }
        //         // message = "[系统提示: 用户什么也没输入, 如果你认为没有必须要说的话, 那就回复“。”, 如果你有想说的话或想做的动作，那就直接正常回答, 但不要一直问用户为什么不说话]";
        //         return setTimeout(this.mainLoop, 10);
        //     }

        //     console.log("messages in buffer:", message);

        //     // 获取当前全部记忆
        //     let time;
        //     time = Date.now();
        //     let memoryBank = await this.getMemory();
        //     console.log('memory bank:', memoryBank);
        //     console.log(`(Get Memory Bank took ${Date.now() - time}ms)`);

        //     // 获取智能体的回复response
        //     let messageObject = {
        //         role: "user",
        //         content: `[时间: ${new Date(Date.now())}] 你的记忆: ${JSON.stringify(memoryBank)};\n用户的输入: ${message}`,
        //         content_type: "text"
        //     }
            
        //     console.log({messageObject});

        //     this.agent.bot.messages.push(messageObject);

        //     // // Minecraft Plugin
        //     // await this.minecraftProxy.request();

        //     time = Date.now();
        //     await this.agent.respondToContext();
        //     console.log(`(Get Main Response took ${Date.now() - time}ms)`);

        //     if (this.audioRecognition.isRecording) { // 在此检测一次用户是否正在说话，并判断是否打断。但可能在麦克风长时间开启的情况下产生不好的效果。
        //         // this.interrupt();
        //     }

        //     // 更新记忆库
        //     this.updateMemory(memoryBank, message);

        //     console.log("waiting until end of all actions");
        //     await this.waitUntilEndOfAllActions();

        //     let sleepTime = (this.userInputBuffer.length === 0) ? 1000 : 10;
        //     this.timeoutId = setTimeout(this.mainLoop, sleepTime);
        // }
    },

    mounted() {

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
                character: 'misaka-zh'
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
            // this.agent.subtitles.translation = new SubtitleHandler(this.$refs.subtitle2); // subtitle DOM element
            this.agent.subtitles.translation = null;

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
            batteryStatus.setup(this.agent);

            // latex plugin
            let latexPlugin = new LatexPlugin(this.$refs['latex-source'], this.$refs['latex-render']);
            latexPlugin.setup(this.agent);

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

.latex-area {
    font-size: 2em;
    position: relative;
    width: 100%;
    height: 20vh;
    /* border: 1px solid black; */
    /* background-color: yellow; */
    display: grid;
    grid-template-columns: 50% 50%;
}

.latex-source {
    user-select: all;
}

.katex-html {
    display: none;
}

</style>