<template>
    <div>
        

        <div class="user-interface">
            <button @click="enableAudioActivities">启用音频</button>
            <input ref="input_area" type="text" v-model="inputText" placeholder="请输入...">
        </div>

        <div id="live2d-area">
            <canvas id="live2d-canvas" class="live2d-canvas">您的浏览器不支持canvas!</canvas>
        </div>

        <div class="visualize-area">
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

import { Resource } from './ResourceManager/ResourceManager.vue';

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

            actionQueueWatcher: [],
            resourcesWatcher: []
        };
    },

    methods: {
        enableAudioActivities() {
            // enableAudio();
            this.$refs.mao_audio_bank.handleUserGesture();
        },
        l2dInit() {
            //
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
                    this.resourcesWatcher.push(resourceManager.get(id));
                }
            }
        }, 200);


        /* 口播 */

        

        const TEXT = `
谢伊·吉尔杰斯-亚历山大将在周一雷霆队对阵华盛顿奇才队的比赛中，为自己的首个MVP奖项增添砝码。这位效力七年的后卫在周六晚上的比赛中再次砍下30分，帮助雷霆在其创队纪录的15连胜被终结后重振旗鼓。此番，亚历山大仅在29分钟内就砍下全场最高的39分，助力雷霆以126-101大胜主队纽约尼克斯。亚历山大21投15中，雷霆一度领先多达30分。这位两届全明星球员本赛季已22次砍下30+，领跑全联盟，场均贡献31.5分、5.9次助攻、5.5个篮板和2.0次抢断。
在战胜纽约尼克斯的比赛中，亚历山大得到了大量的帮助。伊赛亚·乔三分球11投8中，替补出场砍下31分，而杰伦·威廉姆斯则贡献了19分、4个篮板和5次助攻。雷霆队在对阵华盛顿奇才队的最近五次交锋中全部获胜，而奇才队目前以6胜30负的战绩位列NBA垫底。
奇才队在周六的客场比赛中以105-138不敌芝加哥公牛队，遭遇五连败，公牛队全场投篮命中率达到55.8%，三分球命中率更是高达46.9%。“防守转换、控制内线、争抢投篮、篮板球、额外努力……所有这些方面我们做得都不够好，”奇才队主教练布莱恩·基夫告诉《华盛顿邮报》。“我们没有在细节和专注度上达到必要的水平，无法阻止他们。这是我的责任。我们必须做得更好。”
奇才队后卫马尔科姆·布罗格登因右脚疼痛已缺席最近三场比赛，能否出战周日的比赛仍存疑问。布罗格登的缺席为后备后卫贾里德·巴特勒提供了机会，他在过去四场比赛中场均得到18.8分和5.3次助攻。
奇才队正在围绕一群年轻球员进行重建，其中包括后卫凯肖恩·乔治。虽然这位21岁的新秀投篮命中率仅为33.2%，三分球命中率更是只有25.3%，但基夫仍然对他充满信心。“我一点也不担心这个，他的投篮会回来的。他是个不错的投手。”
        `;

        // const TEXT = `这是一段测试文本！可以`;

        function multipleSplit(inputString, delimiters) {
            // 构建一个正则表达式，匹配任一指定的分隔符
            const delimiterRegex = new RegExp('[' + delimiters.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ']+');
            // 使用正则表达式分割字符串
            return inputString.split(delimiterRegex);
        }

        const seps = "。？！?!\n";
        var splitList = multipleSplit(TEXT, seps);
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