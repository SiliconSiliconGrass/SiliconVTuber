<template>
    <div>
        <div class="user-interface" id="user-interface">
            <button v-if="!audioEnabled" @click="enableAudioActivities">启用音频</button>
            <input ref="input_area" type="text" v-model="inputText" placeholder="请输入...">
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
import ResourceManager, { Resource } from './ResourceManager/ResourceManager.vue';
import axios from 'axios';

export default {
    components: {
        AudioBank
    },
    data() {
        return {
            debug: false,
            audioEnabled: false, // The user needs to interact with the page (by clicking the button) to enable audio

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
                this.PAT = response.data;
                this.PAT2 = this.PAT;
            } catch (error) {
                console.error('Error getting token:', error);
            }
        },

        enableAudioActivities() {
            this.audioEnabled = true;
            this.$refs.mao_audio_bank.handleUserGesture();
        },

        broadcast(text) {
            /* 口播 */
            function multipleSplit(inputString, delimiters) {
                // 构建一个正则表达式，匹配任一指定的分隔符
                const delimiterRegex = new RegExp('[' + delimiters.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ']+');
                // 使用正则表达式分割字符串
                return inputString.split(delimiterRegex);
            }

            const seps = "。？！?!\n";
            var splitList = multipleSplit(text, seps);
            var self = this.Mao;
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
                        }
                    }
                }
            }

            self.actionQueue.enqueue({type: "EndOfResponse", data: {}, resources: []}); // 将EndOfResponse动作加入队列
        },

        sendChat(message) {
            this.Mao.respondTo(message);
        }
    },

    mounted() {

        this.getToken()
        .then(() => {

            // [setup]

            this.Mao = new Mao(
                this.PAT, this.MAO_BOT_ID, this.USER_ID,
                this.PAT2, this.TTS_BOT_ID,
            );

            this.actionQueue = this.Mao.actionQueue;

            var resourceManager = new ResourceManager(this.Mao, this.$refs.mao_audio_bank);
            this.Mao.resourceManager = resourceManager;
            this.resourceManager = resourceManager;

            // this.Mao.respondTo("你好呀! 今天过的怎么样? 想我了吗?"); // Test
            // this.broadcast(" ？ ？"); // Test
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
    width: 90vh;
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