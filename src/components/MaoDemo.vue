<template>
    <div>
        

        <div class="user-interface">
            <button @click="enableAudioActivities">启用音频</button>
            <input ref="input_area" type="text" v-model="inputText" placeholder="请输入...">
        </div>

        <div id="live2d-area">
            <canvas id="live2d-canvas" class="live2d-canvas">您的浏览器不支持canvas!</canvas>
        </div>

        <div v-if="debug" class="visualize-area">
            <!-- 行为数据可视化区域 -->
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
        </div>

    </div>
</template>

<script>
import AudioBank from './ResourceManager/AudioBank.vue';
import Mao from './BotBrain/MaoCore.vue';
import ResourceManager from './ResourceManager/ResourceManager.vue';
import axios from 'axios';

export default {
    components: {
        AudioBank
    },
    data() {
        return {
            debug: false,

            // Using two tokens. Maybe unnecessary
            PAT: '', // bot brain token
            PAT2: '', // tts bot token

            MAO_BOT_ID: '7444170557848977471', // Mao
            TTS_BOT_ID: '7444603592826159141', // Mao Speaker
            USER_ID: 'some_user_id', // The user ID

            inputText: '',

            Mao: null,
            actionQueue: null,
            resourceManager: null,

            actionQueueWatcher: [],
            resourcesWatcher: []
        };
    },

    methods: {
        async getToken() {
            try {
                const response = await axios.get('/CozeToken/token.txt', {
                responseType: 'text' // 确保响应类型是文本
                });
                console.log('got token:', response.data);
                this.PAT = response.data;
                this.PAT2 = this.PAT;
            } catch (error) {
                console.error('Error fetching the text file:', error);
            }
        },

        enableAudioActivities() {
            // enableAudio();
            this.$refs.mao_audio_bank.handleUserGesture();
        },

        sendChat(message) {
            this.Mao.respondTo(message);
        }
    },

    mounted() {

        this.getToken()
        .then(() => {
            this.Mao = new Mao(
                this.PAT, this.MAO_BOT_ID, this.USER_ID,
                this.PAT2, this.TTS_BOT_ID,
            );

            this.actionQueue = this.Mao.actionQueue;

            var resourceManager = new ResourceManager(this.Mao, this.$refs.mao_audio_bank);
            this.Mao.resourceManager = resourceManager;
            this.resourceManager = resourceManager;
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
                this.sendChat(this.inputText);
                this.inputText = '';
            }
        });

        // this.Mao.respondTo("你好呀! 今天过的怎么样? 想我了吗?"); // Test
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
    position: absolute;
    width: 100%;
    left: 50vw;
    top: 100vh;
    transform: translate(-50%, -200%);
}

.user-interface > * {
    border-radius: 10px;
    margin: 10px;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    font-size: 2em;
}
.user-interface > input {
    width: 800px;
}

.visualize-area {
    position: absolute;
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