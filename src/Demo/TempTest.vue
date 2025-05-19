<template>
    <div>
        <!-- Temp Test -->
         <button @click="enableAudioActivities" style="position: fixed; z-index: 999;">启用音频</button>
        <canvas ref="testCanvas1" width="500" height="800" style="position: absolute; left: 0;"></canvas>
        <canvas ref="testCanvas2" width="500" height="800" style="position: absolute; right: 0;"></canvas>
        <div id="user-interface"></div>
    </div>
</template>

<script>

import ActionQueue from '@/SiliconVTuberCore/plugins/silicon-plugins/ActionQueue/ActionQueue.js';
import BatteryStatus from '@/SiliconVTuberCore/plugins/silicon-plugins/BatteryStatus.js';
import L2dDisplay from '@/SiliconVTuberCore/plugins/silicon-plugins/L2dDisplay/L2dDisplay.js';
import VTuber from '@/SiliconVTuberCore/Agent/VTuberAgent.js';
import { getToken } from '@/SiliconVTuberCore/utils/tokenGatewary.js';
import { createAgent } from '@/SiliconVTuberCore/utils/createAgent.js';

export default {
    components: {
        // ...
    },
    data() {
        return {
            // ...
        };
    },

    methods: {
        enableAudioActivities() {
            this.agent1.resourceManager.audioBank.handleUserGesture();
            this.agent2.resourceManager.audioBank.handleUserGesture();
            console.log('click!');
        }
    },

    mounted() {

        const testAgentConfig1 = {
            Agent: VTuber,
            botConfig: {
                type: 'GLM',
                token: getToken('glm'),
                modelName: 'glm-4-flash',
            },
            queryTemplate: null,

            plugins: [
                [ActionQueue, { ttsConfig: { type: 'gptsovits', character: 'misaka-zh' }, translationConfig: null }],
                [L2dDisplay, { modelURL: '/Resources/mikoto/mikoto.model.json', canvas: this.$refs.testCanvas1,
                    motionDict: {
                        'akimbo': {group: 'tap', order: 0, duration: 1000},
                        'raise_one_hand': {group: 'tap', order: 1, duration: 1000}
                    },
                    expressionDict: {
                        'no_expression': {order: 0},
                        'smile': {order: 1},
                        'frown': {order: 2},
                        'doubtful': {order: 3},
                        'smile_with_eyes_closed': {order: 4},
                        'shocked': {order: 5},
                        'blush': {order: 6},
                    } }],
                [BatteryStatus, {}],
            ]
        };

        const testAgentConfig2 = {
            Agent: VTuber,
            botConfig: {
                type: 'GLM',
                token: getToken('glm'),
                modelName: 'glm-4-flash',
            },
            queryTemplate: null,

            plugins: [
                [ActionQueue, { ttsConfig: { type: 'gptsovits', character: 'misaka-zh' }, translationConfig: null }],
                [L2dDisplay, { modelURL: '/Resources/mikoto/mikoto.model.json', canvas: this.$refs.testCanvas2,
                    motionDict: {
                        'akimbo': {group: 'tap', order: 0, duration: 1000},
                        'raise_one_hand': {group: 'tap', order: 1, duration: 1000}
                    },
                    expressionDict: {
                        'no_expression': {order: 0},
                        'smile': {order: 1},
                        'frown': {order: 2},
                        'doubtful': {order: 3},
                        'smile_with_eyes_closed': {order: 4},
                        'shocked': {order: 5},
                        'blush': {order: 6},
                    } }],
                [BatteryStatus, {}],
            ]
        };

        const agent1 = createAgent(testAgentConfig1);
        const agent2 = createAgent(testAgentConfig2);
        console.log(agent1);
        console.log(agent2);

        agent1.appendContext('你好呀');
        agent1.respondToContext()

        agent2.appendContext('请说“这是测试语音一”');
        console.log(agent2.messages);
        agent2.respondToContext()

        console.log('audioBank', agent1.resourceManager.audioBank);

        this.agent1 = agent1;
        this.agent2 = agent2;

    }
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