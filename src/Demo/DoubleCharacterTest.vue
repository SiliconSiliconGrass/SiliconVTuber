<template>
    <div>
        <div class="background-image"></div>

        <div class="danmuku-area" ref="danmukuArea"></div>

        <div class="user-interface" id="user-interface">
            <!-- UI区域 -->
            <button v-if="!audioEnabled" @click="enableAudioActivities">启用音频</button>
            <!-- <input ref="input_area" type="text" v-model="inputText" placeholder="请输入...">
            <button @click="switchMicrophoneMode">{{ (microphoneOn) ? '闭麦' : '开麦' }}</button> -->
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
import { Soyo } from '@/agent-presets/soyo/soyo.js';
import { Anon } from '@/agent-presets/anon/anon.js';

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

        const agent1 = Soyo(this.$refs.testCanvas1, this.$refs.subtitle1, this.$refs.subtitle2, this.$refs.danmukuArea);
        const agent2 = Anon(this.$refs.testCanvas2, this.$refs.subtitle3, this.$refs.subtitle4);

        console.log('agents:', {agent1, agent2});
        
        // console.log(agent1);
        // console.log(agent2);

        // agent1.appendContext('你好呀');
        // agent1.respondToContext()

        // agent2.appendContext('请说“这是测试语音一”');
        // console.log(agent2.messages);
        // agent2.respondToContext()

        // this.agent1 = agent1; // soyo
        // this.agent2 = agent2; // anon

        agent1.mainLoop(agent1);
        agent2.mainLoop(agent2);

        this.agent1 = agent1;
        this.agent2 = agent2;

        const self = this;

        agent1.addEventListener('start_of_response', (e) => {
            self.turn = 0;
        })

        agent1.addEventListener('end_of_response', (e) => {
            const response = e.detail.response;
            agent2.userInputBuffer.push(response);
        });

        agent2.addEventListener('start_of_response', (e) => {
            self.turn = 1;
        })

        agent2.addEventListener('end_of_response', (e) => {
            const response = e.detail.response;
            agent1.userInputBuffer.push(response);
        });

        agent1.userInputBuffer.push('[系统提示：直播开始了，跟大家打个招呼吧！]')

        // setInterval(() => {
        //     // 可视化
        //     this.actionQueueWatcher = [];
        //     if (this.actionQueue) {
        //         for (let action of this.actionQueue.queue) {
        //             this.actionQueueWatcher.push(action);
        //         }
        //     }

        //     this.resourcesWatcher = [];
        //     if (this.resourceManager) {
        //         for (let id of this.resourceManager.resourceIds) {
        //             this.resourcesWatcher.push(this.resourceManager.get(id));
        //         }
        //     }
        // }, 200);

        // this.$refs.input_area.addEventListener("keydown", (event) => {
        //     if (event.key === 'Enter') {
        //         this.recordChat(this.inputText);
        //         this.inputText = '';
        //     }
        // });

        // Main Loop
        
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

.danmuku-area {
    position: fixed;
    width: 30vw;
    height: 100vh;
    /* border: 1px solid black; */
    overflow-y: scroll;
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