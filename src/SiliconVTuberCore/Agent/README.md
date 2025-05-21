# Agent 技术文档
Agent 是用于管理智能体行为的重要对象。

## 1. 抽象基类
参见 ./AbstractAgent.js

AbstractAgent 继承了 EventTarget，这意味着其子类的实例上可以 addEventListener 和 dispatchEvent
AbstractAgent 的子类需要实现两个方法：respondToContext 和 appendContext

```javascript
class AbstractAgent extends EventTarget {

    // ... 省略 constructor 等

    /**
     * 将聊天上下文传递给Agent
     * @param {[{role: 'user' | 'agent' | 'system', content: string}] | null} messages 聊天历史 （可选，为空时默认使用Agent的历史）
     */
    async respondToContext(messages) {
        // ...
    }

    /**
     * 向Agent记录的聊天历史中添加一条消息
     * @param {string} text 消息内容
     * @param {'user' | 'agent' | 'system'} role 消息角色
     */
    appendContext(text, role = 'user') {
        // ...
        // 一般可以这么写：
        if (!Array.isArray(this.messages)) this.messages = [];
        this.messages.push({content: text, role: role});
        // 但由于各家大模型对上下文的格式要求略有区别，故在此作为抽象方法
    }
}
```
开发者可以自己定义一个AbstractAgent的子类，来实现对特殊应用场景的支持。

另外，AbstractAgent 提供 addPlugin 方法来挂载插件。关于插件的作用与编写规则，参见 ../plugins/README.md

## 2. VTuberAgent
VTuberAgent是专门为虚拟主播场景实现的AbstractAgent子类
代码参见 ./VTuberAgent.js

VTuberAgent 依赖于 silicon-plugins 中的 ActionQueue ，因此需要在启动 mainLoop 之前挂载 ActionQueue 插件实例。

VTuberAgent 主要做了以下几件事情：
1. 定义了一个主循环 (mainLoop)，在主循环中，判断如果 this.userInputBuffer 不为空列表，则将其中的用户输入信息提交给大模型，并指导模型的回应动作；
2. 定义了 queryTemplate ，用于格式化用户输入文本与插件信息文本，在向大模型发起请求前，会把 queryTemplate 中的 ```%TIME%```  ```%USER_INPUT%``` ```%PLUGIN_INFO%``` 等关键字替换为相应文本，然后再提交给大模型；
3. 对 Bot 返回的流式文本进行了异步分句处理，便于分句语音合成 (关于 Bot 详见 ../Bot；关于语音合成 TTS 详见 ../plugins/silicon-plugins/ActionQueue/TTS)；
4. 定义了 waitUntilEndOfResponse，即，等待直到ActionQueue处理完全部动作队列中的全部动作。

如果需要创建 VTuberAgent 实例，开发者应当首先考虑使用 ../utils/createAgent.js 中的 createAgent 函数。
示例如下：
```javascript
import VTuber from "@/SiliconVTuberCore/Agent/VTuberAgent.js"
import ActionQueue from "@/SiliconVTuberCore/plugins/silicon-plugins/ActionQueue/ActionQueue.js"
import BatteryStatus from "@/SiliconVTuberCore/plugins/silicon-plugins/BatteryStatus.js"
import L2dDisplay from "@/SiliconVTuberCore/plugins/silicon-plugins/L2dDisplay/L2dDisplay.js"
import { getToken } from "@/SiliconVTuberCore/utils/tokenGatewary.js"
import { createAgent } from "@/SiliconVTuberCore/utils/createAgent.js"

const exampleAgentConfig = {
    Agent: VTuber,
    botConfig: {
        type: 'GLM',
        token: getToken('glm'),
        modelName: 'glm-4-flash',
    },
    queryTemplate: '[时间: %TIME%]\n 插件信息：%PLUGIN_INFO% \n用户的输入: %USER_INPUT%',

    plugins: [
        [ActionQueue, { ttsConfig: { type: 'gptsovits', character: 'misaka-ja' }, translationConfig: null }],
        [L2dDisplay, { modelURL: '/Resources/mikoto/mikoto.model.json', canvas: new HTMLCanvasElement(),
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
}

const agent = createAgent(exampleAgentConfig);
```