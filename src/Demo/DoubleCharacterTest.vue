<template>
    <div>
        <div class="background-image"></div>
        <div class="user-interface" id="user-interface">
            <!-- UI区域 -->
            <button v-if="!audioEnabled" @click="enableAudioActivities">启用音频</button>
            <input ref="input_area" type="text" v-model="inputText" placeholder="请输入...">
            <button @click="switchMicrophoneMode">{{ (microphoneOn) ? '闭麦' : '开麦' }}</button>
        </div>

        <div class="subtitle-area">
            <div style="position: absolute; width: 100%; height: 100%;">
                <span ref="subtitle1" class="subtitle"></span>
                <br>
                <span ref="subtitle2" class="subtitle"></span>
            </div>
            <div style="position: absolute; width: 100%; height: 100%;">
                <span ref="subtitle3" class="subtitle"></span>
                <br>
                <span ref="subtitle4" class="subtitle"></span>
            </div>
        </div>

        <!-- {{ (this.agent) ? this.agent.userInputBuffer : ''}} -->
        <div class="canvas-container">
            <canvas ref="testCanvas1" id="leftCanvas"
                :class="(turn === 0) ? 'canvas' : 'canvas canvas_hidden'"></canvas>
            <canvas ref="testCanvas2" id="rightCanvas"
                :class="(turn === 1) ? 'canvas' : 'canvas canvas_hidden'"></canvas>
        </div>

        <div v-if="debug" class="visualize-area">
            <!-- 数据可视化区域 -->
            <div v-if="actionQueueWatcher" class="action-queue">
                <div v-for="(action, i) in actionQueueWatcher" :key="i" class="action-container">
                    <span> 动作类型: {{ action.type }} <br>
                        内容: {{ action.data }}
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
import ActionQueue from '@/SiliconVTuberCore/plugins/silicon-plugins/ActionQueue/ActionQueue.js';
import BatteryStatus from '@/SiliconVTuberCore/plugins/silicon-plugins/BatteryStatus.js';
import L2dDisplay from '@/SiliconVTuberCore/plugins/silicon-plugins/L2dDisplay/L2dDisplay.js';
import VTuber from '@/SiliconVTuberCore/Agent/VTuberAgent.js';
import { getToken } from '@/SiliconVTuberCore/utils/tokenGatewary.js';
import { createAgent } from '@/SiliconVTuberCore/utils/createAgent.js';
import { getPrompt } from '@/SiliconVTuberCore/utils/promptBank';
import { live2dPrompter } from '@/SiliconVTuberCore/utils/live2dPrompter.js';
import SubtitlePlugin from '@/SiliconVTuberCore/plugins/silicon-plugins/SubtitlePlugin.js';

export default {
    components: {
        // ... 
    },
    data() {
        return {
            debug: false,
            audioEnabled: false, // The user needs to interact with the page (by clicking the button) to enable audio

            turn: 0, // 表示当前是哪个角色在说话 (0表示soyo, 1表示anon)
        };
    },

    methods: {
        enableAudioActivities() {
            this.agent1.resourceManager.audioBank.handleUserGesture();
            this.agent2.resourceManager.audioBank.handleUserGesture();
            this.audioEnabled = true;
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

        // interrupt() {
        //     this.actionQueue.queue = [];
        //     this.resourceManager.clearResources();

        //     clearTimeout(this.resourceManager.timeoutId);
        //     this.resourceManager.mainLoop();
        //     clearTimeout(this.actionQueue.timeoutId);
        //     this.actionQueue.mainLoop();
        //     this.actionQueue.dispatchEvent(new Event('empty'));

        //     for (let key in this.agent.subtitles) {
        //         let subtitle = this.agent.subtitles[key];
        //         if (subtitle) {
        //             subtitle.clear();
        //         }
        //     }
        // },

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

        const l2dconfig1 = {
            modelURL: '/Resources/mygo_mujica/figure/mygo/soyo/casual/model.json', canvas: this.$refs.testCanvas1,
            motionDict: {
                'soyo_serious02': { group: 'soyo_serious02', order: 0, duration: 1000 },
                'soyo_nnf02': { group: 'soyo_nnf02', order: 0, duration: 1000 },
                'soyo_bye02': { group: 'soyo_bye02', order: 0, duration: 1000 },
                'soyo_bye01': { group: 'soyo_bye01', order: 0, duration: 1000 },
                'soyo_nf02': { group: 'soyo_nf02', order: 0, duration: 1000 },
                'soyo_nnf04': { group: 'soyo_nnf04', order: 0, duration: 1000 },
                'soyo_kime01': { group: 'soyo_kime01', order: 0, duration: 1000 },
                'soyo_nnf_left01': { group: 'soyo_nnf_left01', order: 0, duration: 1000 },
                'soyo_nnf03': { group: 'soyo_nnf03', order: 0, duration: 1000 },
                'soyo_serious04': { group: 'soyo_serious04', order: 0, duration: 1000 },
                'soyo_cry02': { group: 'soyo_cry02', order: 0, duration: 1000 },
                'soyo_shame01': { group: 'soyo_shame01', order: 0, duration: 1000 },
                'soyo_nnf01': { group: 'soyo_nnf01', order: 0, duration: 1000 },
                'soyo_nf04': { group: 'soyo_nf04', order: 0, duration: 1000 },
                'soyo_angry01': { group: 'soyo_angry01', order: 0, duration: 1000 },
                'soyo_thinking02': { group: 'soyo_thinking02', order: 0, duration: 1000 },
                'soyo_odoodo01': { group: 'soyo_odoodo01', order: 0, duration: 1000 },
                'soyo_nnf05': { group: 'soyo_nnf05', order: 0, duration: 1000 },
                'soyo_nnf_right01': { group: 'soyo_nnf_right01', order: 0, duration: 1000 },
                'soyo_ando01': { group: 'soyo_ando01', order: 0, duration: 1000 },
                'soyo_nf_left01': { group: 'soyo_nf_left01', order: 0, duration: 1000 },
                'soyo_idle01': { group: 'soyo_idle01', order: 0, duration: 1000 },
                'soyo_sad01': { group: 'soyo_sad01', order: 0, duration: 1000 },
                'soyo_nf05': { group: 'soyo_nf05', order: 0, duration: 1000 },
                'soyo_nf01': { group: 'soyo_nf01', order: 0, duration: 1000 },
                'soyo_sad02': { group: 'soyo_sad02', order: 0, duration: 1000 },
                'soyo_smile03': { group: 'soyo_smile03', order: 0, duration: 1000 },
                'soyo_smile01': { group: 'soyo_smile01', order: 0, duration: 1000 },
                'soyo_angry02': { group: 'soyo_angry02', order: 0, duration: 1000 },
                'soyo_nf_right01': { group: 'soyo_nf_right01', order: 0, duration: 1000 },
                'soyo_smile02': { group: 'soyo_smile02', order: 0, duration: 1000 },
                'soyo_serious01': { group: 'soyo_serious01', order: 0, duration: 1000 },
                'soyo_smile04': { group: 'soyo_smile04', order: 0, duration: 1000 },
                'soyo_smile05': { group: 'soyo_smile05', order: 0, duration: 1000 },
                'soyo_thinking01': { group: 'soyo_thinking01', order: 0, duration: 1000 },
                'soyo_serious03': { group: 'soyo_serious03', order: 0, duration: 1000 },
                'soyo_sad03': { group: 'soyo_sad03', order: 0, duration: 1000 },
                'soyo_shame02': { group: 'soyo_shame02', order: 0, duration: 1000 },
                'soyo_nf03': { group: 'soyo_nf03', order: 0, duration: 1000 },
                'soyo_angry03': { group: 'soyo_angry03', order: 0, duration: 1000 },
                'soyo_cry01': { group: 'soyo_cry01', order: 0, duration: 1000 },
                'soyo_wink01': { group: 'soyo_wink01', order: 0, duration: 1000 },
                'soyo_kandou01': { group: 'soyo_kandou01', order: 0, duration: 1000 },
                'soyo_surprised01': { group: 'soyo_surprised01', order: 0, duration: 1000 },
                'soyo_e235_gacha01': { group: 'soyo_e235_gacha01', order: 0, duration: 1000 },
                'soyo_e250_gacha01': { group: 'soyo_e250_gacha01', order: 0, duration: 1000 },
            },
            expressionDict: {
                'soyo_angry01': {order: 103},
                'soyo_ando01': {order: 104},
                'soyo_thinking01': {order: 105},
                'soyo_odoodo01': {order: 106},
                'soyo_serious04': {order: 107},
                'soyo_sad03': {order: 108},
                'soyo_cry01': {order: 109},
                'soyo_surprised01': {order: 110},
                'soyo_wink01': {order: 111},
                'soyo_kandou01': {order: 112},
                'soyo_smile03': {order: 113},
                'soyo_sad02': {order: 114},
                'soyo_angry03': {order: 115},
                'soyo_cry02': {order: 116},
                'soyo_smile02': {order: 117},
                'soyo_smile05': {order: 118},
                'soyo_smile04': {order: 119},
                'soyo_shame02': {order: 120},
                'soyo_thinking02': {order: 121},
                'soyo_idle01': {order: 122},
                'soyo_smile01': {order: 123},
                'soyo_bye01': {order: 124},
                'soyo_kime01': {order: 125},
                'soyo_sad01': {order: 126},
                'soyo_serious01': {order: 127},
                'soyo_default': {order: 128},
                'soyo_shame01': {order: 129},
                'soyo_serious02': {order: 130},
                'soyo_serious03': {order: 131},
                'soyo_bye02': {order: 132},
                'soyo_angry02': {order: 133},
            }
        }

        const testAgentConfig1 = {
            Agent: VTuber,
            botConfig: {
                type: 'GLM',
                token: getToken('glm'),
                modelName: 'glm-4-flash',
                systemPrompt: live2dPrompter(getPrompt('soyo'), l2dconfig1)
            },
            queryTemplate: null,

            plugins: [
                [ActionQueue, {
                    ttsConfig: {
                        type: 'gptsovits',
                        // character: 'misaka-zh', // debug
                        "refer_wav_path": "参考音频/Soyo干声素材/正常参考/うちはとても裕福になった綺麗な家に引っ越して.wav",
                        "prompt_text": "うちはとても裕福になった綺麗な家に引っ越して。",
                        "prompt_language": "ja",
                        "text_language": "zh", // 要合成的文本的语言
                        // "text_language": "zh",
                        "temperature": 1.0,
                        "speed": 1.0,


                        "text": "",
                        "speaker": "soyo0"

                    }, translationConfig: null
                }],
                [L2dDisplay, l2dconfig1],
                [BatteryStatus, {}],
                [SubtitlePlugin, {element: this.$refs.subtitle1, enableTranslation: false}],
            ]
        };

        const l2dconfig2 = {
            modelURL: '/Resources/mygo_mujica/figure/mygo/anon/casual/model.json', canvas: this.$refs.testCanvas2,
            motionDict: {
                'anon_angry01': { group: 'anon_angry01', order: 0, duration: 1000 },
                'anon_smile01': { group: 'anon_smile01', order: 0, duration: 1000 },
                'anon_thinking01': { group: 'anon_thinking01', order: 0, duration: 1000 },
                'anon_nnf02': { group: 'anon_nnf02', order: 0, duration: 1000 },
                'anon_smile04': { group: 'anon_smile04', order: 0, duration: 1000 },
                'anon_serious02': { group: 'anon_serious02', order: 0, duration: 1000 },
                'anon_smile02': { group: 'anon_smile02', order: 0, duration: 1000 },
                'anon_angry04': { group: 'anon_angry04', order: 0, duration: 1000 },
                'anon_nnf_right01': { group: 'anon_nnf_right01', order: 0, duration: 1000 },
                'anon_nf05': { group: 'anon_nf05', order: 0, duration: 1000 },
                'anon_nnf05': { group: 'anon_nnf05', order: 0, duration: 1000 },
                'anon_angry02': { group: 'anon_angry02', order: 0, duration: 1000 },
                'anon_nnf04': { group: 'anon_nnf04', order: 0, duration: 1000 },
                'anon_thinking03': { group: 'anon_thinking03', order: 0, duration: 1000 },
                'anon_angry03': { group: 'anon_angry03', order: 0, duration: 1000 },
                'anon_nf_right01': { group: 'anon_nf_right01', order: 0, duration: 1000 },
                'anon_sad01': { group: 'anon_sad01', order: 0, duration: 1000 },
                'anon_nf_left01': { group: 'anon_nf_left01', order: 0, duration: 1000 },
                'anon_kandou02': { group: 'anon_kandou02', order: 0, duration: 1000 },
                'anon_shame01': { group: 'anon_shame01', order: 0, duration: 1000 },
                'anon_cry01': { group: 'anon_cry01', order: 0, duration: 1000 },
                'anon_nf03': { group: 'anon_nf03', order: 0, duration: 1000 },
                'anon_cry02': { group: 'anon_cry02', order: 0, duration: 1000 },
                'anon_nnf03': { group: 'anon_nnf03', order: 0, duration: 1000 },
                'anon_nf02': { group: 'anon_nf02', order: 0, duration: 1000 },
                'anon_bye01': { group: 'anon_bye01', order: 0, duration: 1000 },
                'anon_shame02': { group: 'anon_shame02', order: 0, duration: 1000 },
                'anon_smile03': { group: 'anon_smile03', order: 0, duration: 1000 },
                'anon_sad02': { group: 'anon_sad02', order: 0, duration: 1000 },
                'anon_wink01': { group: 'anon_wink01', order: 0, duration: 1000 },
                'anon_thinking02': { group: 'anon_thinking02', order: 0, duration: 1000 },
                'anon_kime02': { group: 'anon_kime02', order: 0, duration: 1000 },
                'anon_nnf01': { group: 'anon_nnf01', order: 0, duration: 1000 },
                'anon_nf01': { group: 'anon_nf01', order: 0, duration: 1000 },
                'anon_nnf_left01': { group: 'anon_nnf_left01', order: 0, duration: 1000 },
                'anon_kandou01': { group: 'anon_kandou01', order: 0, duration: 1000 },
                'anon_nf04': { group: 'anon_nf04', order: 0, duration: 1000 },
                'anon_surprised01': { group: 'anon_surprised01', order: 0, duration: 1000 },
                'anon_serious01': { group: 'anon_serious01', order: 0, duration: 1000 },
                'anon_idle01': { group: 'anon_idle01', order: 0, duration: 1000 },
                'anon_kime01': { group: 'anon_kime01', order: 0, duration: 1000 },
                'anon_e235_gacha01': { group: 'anon_e235_gacha01', order: 0, duration: 1000 },
                'anon_e253_gacha01': { group: 'anon_e253_gacha01', order: 0, duration: 1000 },
                'anon_e253_smile01': { group: 'anon_e253_smile01', order: 0, duration: 1000 },
            },
            expressionDict: {
                'anon_default': {order: 0},
                'anon_angry02': {order: 1},
                'anon_kandou02': {order: 2},
                'anon_thinking01': {order: 3},
                'anon_idle01': {order: 4},
                'anon_shame02': {order: 5},
                'anon_surprised01': {order: 6},
                'anon_kime01': {order: 7},
                'anon_shame01': {order: 8},
                'anon_bye01': {order: 9},
                'anon_cry01': {order: 10},
                'anon_cry02': {order: 11},
                'anon_serious02': {order: 12},
                'anon_angry04': {order: 13},
                'anon_thinking03': {order: 14},
                'anon_kandou01': {order: 15},
                'anon_smile03': {order: 16},
                'anon_kime02': {order: 17},
                'anon_smile01': {order: 18},
                'anon_wink01': {order: 19},
                'anon_thinking02': {order: 20},
                'anon_sad01': {order: 21},
                'anon_angry01': {order: 22},
                'anon_angry03': {order: 23},
                'anon_smile02': {order: 24},
                'anon_serious01': {order: 25},
                'anon_smile04': {order: 26},
                'anon_sad02': {order: 27},
            }
            
        }

        const testAgentConfig2 = { // Anon
            Agent: VTuber,
            botConfig: {
                type: 'GLM',
                token: getToken('glm'),
                modelName: 'glm-4-flash',
                sytemPrompt: live2dPrompter(getPrompt('anon'), l2dconfig2)
            },
            queryTemplate: null,

            plugins: [
                [ActionQueue, {
                    ttsConfig: {
                        type: 'gptsovits',
                        // character: 'misaka-zh', // debug
                        "refer_wav_path": "参考音频/Anon干声素材/参考音频/うちの学校本当にバンドやってる子が多いんだなぁ登下校の時も.wav",
                        "prompt_text": "うちの学校本当にバンドやってる子が多いんだなぁ登下校の時も",
                        "prompt_language": "ja",
                        "text_language": "zh", // 要合成的文本的语言
                        // "text_language": "zh",
                        "temperature": 1.0,
                        "speed": 1.0,


                        "text": "",
                        "speaker": "anon"
                    }, translationConfig: null
                }],

                [L2dDisplay, l2dconfig2],
                [BatteryStatus, {}],
                [SubtitlePlugin, {element: this.$refs.subtitle2, enableTranslation: false}],
            ]
        };

        const agent1 = createAgent(testAgentConfig1);
        const agent2 = createAgent(testAgentConfig2);
        console.log(agent1);
        console.log(agent2);

        // agent1.appendContext('你好呀');
        // agent1.respondToContext()

        // agent2.appendContext('请说“这是测试语音一”');
        // console.log(agent2.messages);
        // agent2.respondToContext()

        this.agent1 = agent1; // soyo
        this.agent2 = agent2; // anon

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

        // Main Loop

        /** @type {string} */
        let topic = '【初始话题】给大家打招呼。';

        /** @type {string} */
        let prevAnswer = '';

        const self = this;

        async function mainLoop() {

            self.turn = 0;

            agent1.appendContext(prevAnswer + `（当前话题：${topic}）`);
            prevAnswer = await agent1.respondToContext();
            console.log('Soyo:', prevAnswer);

            await agent1.waitUntilEndOfResponse();

            self.turn = 1;

            agent2.appendContext(prevAnswer + `（当前话题：${topic}）`);
            prevAnswer = await agent2.respondToContext();
            console.log('Anon:', prevAnswer);

            await agent2.waitUntilEndOfResponse();

            agent1.appendContext(`(旁白)当前话题为“${topic}”, 输出你想更换的话题。如果当前话题还没讨论完，请输出当前话题。`);
            topic = await agent1.respondToContext();

            console.log('Current topic:', topic);

            // requestAnimationFrame(mainLoop());
            setTimeout(mainLoop, 100);
        }

        mainLoop(); // start main loop
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

.canvas-container {
    margin: 0;
    padding: 0;
    /* display: flex; */
    /* 使用flex布局 */
    width: 100%;
    /* 充满屏幕宽度 */
    height: 100vh;
    /* 充满屏幕高度 */
}

.left-section,
.right-section {
    flex: 1;
    /* 均等分配空间 */
    height: 100%;
    /* 继承容器高度 */
    position: relative;
}

.canvas {
    position: absolute;
    margin: 0;
    padding: 0;
    display: block;
    /* 避免canvas默认inline带来的空白间隙 */
    width: 100%;
    /* 充满父容器 */
    height: 100%;
    /* 充满父容器 */

    opacity: 1;
    transform: translateX(0);
    transition: opacity 0.5s ease, transform 0.5s ease;
}

.canvas_hidden {
    transform: translateX(-50px);
    opacity: 0;
}



.user-interface {
    z-index: 999;
    position: fixed;
    width: 90vw;
    /* 1vw = 视口宽的的1% */
    max-width: 600px;
    left: 50vw;
    top: 100vh;
    transform: translate(-50%, -150%);
    /* border: 1px solid black; */
    /* background-color: yellow; */
    /* -webkit-app-region: drag; */
}

.user-interface>* {
    border-radius: 10px;
    margin: 10px;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    font-size: 2em;
}

.user-interface>input {
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

.background-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('@/assets/bg01020.png');
    /* 替换为你的图片路径 */
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    z-index: -1
}
</style>