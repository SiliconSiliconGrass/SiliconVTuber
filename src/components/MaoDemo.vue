<template>
    <img alt="Vue logo" src="../assets/logo.png">
    <div>
        <AudioBank ref="mao_audio_bank"/>
        <button @click="enableAudio">启用音频</button>
        <input ref="input_area" type="text" v-model="inputText" placeholder="请输入...">

        <div id="live2d-area">
            <canvas id="live2d-canvas" class="live2d-canvas">您的浏览器不支持canvas!</canvas>
        </div>

        <div class="visualize-area">
            <!-- 行为数据可视化区域 -->
            <div v-if="actionQueue" class="action-queue">
                <div v-for="(action, i) in actionQueue.queue" :key="i" class="action-container">
                    <span> 动作类型: {{ action.type }} <br>
                        内容: {{action.data}}
                    </span>
                </div>
            </div>

            <div v-if="resourceManager" class="resource-bank">
                <!-- {{ resourceManager.resourceBank }} <br>
                {{ resourceManager.resourceIds }} -->
                <div v-for="(id, i) in resourceManager.resourceIds" :key="i" class="resource-container">
                    {{ resourceManager.get(id) }}
                    <!-- <span> 资源类型: {{ resourceManager.resourceBank[id].type }} <br>
                        是否就绪: {{ resourceManager.resourceBank[id].ready }} <br>
                        内容: {{ resourceManager.resourceBank[id].data }}
                    </span> -->
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import AudioBank from './ResourceManager/AudioBank.vue';
import Mao from './BotBrain/MaoCore.vue';
import ResourceManager from './ResourceManager/ResourceManager.vue';

// import * as PIXI from 'pixi.js';
// import 'pixi-live2d-display';
// import { Live2DModel } from 'pixi-live2d-display';

export default {
    components: {
        AudioBank
    },
    data() {
        return {

            // PAT: 'pat_bGvnxxW2UYNwE2UL2pReUuNIZF0JMIK9OtP0BdUh5gzw5yHECLohwM8MxsoeLF10', // Personal access token
            PAT: 'pat_JEvKfnxhGwlEi510PQTwADBA4hJIJqQMlrgE373qdlDJrRyGrExskzAdsZkxz6Dw',
            PAT2: 'pat_JEvKfnxhGwlEi510PQTwADBA4hJIJqQMlrgE373qdlDJrRyGrExskzAdsZkxz6Dw', // Using two different tokens. Maybe unnecessary
            MAO_BOT_ID: '7444170557848977471', // Mao
            TTS_BOT_ID: '7444603592826159141', // Mao Speaker
            USER_ID: 'some_user_id', // The user ID

            inputText: '',

            Mao: null,
            actionQueue: null,
            resourceManager: null,
        };
    },

    methods: {
        l2dInit() {
            // // 创建 PixiJS 应用程序
            // const app = new PIXI.Application({
            //     width: 500, // 根据需要设置宽高
            //     height: 500,
            //     transparent: true, // 背景透明
            //     antialias: true // 抗锯齿
            // });

            // // 将 PixiJS 视图添加到 DOM 中
            // this.$refs.live2dContainer.appendChild(app.view);

            // // 加载 Live2D 模型
            // Live2DModel.fromURL('Models/Mao/Mao.model3.json').then((model) => {
            //     // 设置模型的位置和大小
            //     model.position.set(250, 250);
            //     model.scale.set(0.2); // 根据需要调整缩放

            //     // 将模型添加到舞台
            //     app.stage.addChild(model);

            //     // 可以在这里添加模型交互逻辑
            //     // 例如：模型点击事件、拖动事件等

            //     // 模型加载完成后的其他逻辑
            // }).catch((err) => {
            //     console.error('Live2D 模型加载失败:', err);
            // });
        },

        playAudio() {
            // // 确保浏览器已经加载了audio元素
            // this.$refs.audioPlayer.load();
            // // 播放音频
            // this.$refs.audioPlayer.play();
        },

        sendChat(message) {
            this.Mao.respondTo(message);
        }
    },

    mounted() {
        this.l2dInit();

        // loadOml2d({
        //     models: [
        //         // 在这里进行配置
        //         // {
        //         //     path: 'https://model.oml2d.com/Senko_Normals/senko.model3.json',
        //         //     position: [-10, 20]
        //         // },
        //         {
        //             path: "/Models/Mao/Mao.model3.json",
        //             position: [10, 20]
        //         }
        //     ]
        // });

        this.Mao = new Mao(
            this.PAT, this.MAO_BOT_ID, this.USER_ID,
            this.PAT2, this.TTS_BOT_ID,
            //
        );

        this.actionQueue = this.Mao.actionQueue;

        var resourceManager = new ResourceManager(this.Mao, this.$refs.mao_audio_bank);
        this.Mao.resourceManager = resourceManager;
        this.resourceManager = resourceManager;

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
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
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