# Plugins 技术文档
plugin 是指 Agent 对象的插件。令 Agent 下属的各项事务由其挂载 plugins 完成，旨在方便开发新功能和新接口。

## 1. 抽象基类
plugin 的抽象基类在 ./AbstractPlugin.js 中。

AbstractPlugin 继承了 EventTarget，这意味着其子类的实例可以 addEventListener 和 dispatchEvent。
AbstractPlugin 的子类需要实现两个方法：setup 和 queryToLLM
```javascript

/** @typedef {AbstractAgent} Agent */

export default class AbstractPlugin extends EventTarget {

    // ...

    /**
     * 将插件挂载到Agent对象上 (可以在此处使用 EventListener 设置不阻塞 Agent.mainLoop 的处理逻辑)
     * @param {Agent} agent parent agent
     */
    setup(agent) {
        // ...
    }

    /**
     * 获取额外提示词 (可以提供插件信息等；该方法会在向 LLM 发起请求前调用，且会阻塞 Agent.mainLoop)
     * 
     * 异步返回一个字符串，该字符串将被添加到 LLM 的 prompt 中
     * @param {Agent} agent parent agent
     * @param {String} userInput user's latest input
     * @returns {Promise<string>} extra prompt text
     */
    async queryToLLM(agent, userInput) {
        // ...
    }
}
```

如何挂载插件？
使用 Agent 的 ```addPlugin(plugin)``` 方法，将 plugin 实例挂载到 Agent 实例上。
开发者也可以使用 ../utils/createAgent.js 中的 ```createAgent```  函数，在 ```plugins``` 配置项中设置插件基类与插件配置参数，这样得到的 Agent 会自动按 ```plugins``` 中的参数和顺序来挂载各插件。

## 2. 插件编写建议
(1) 非阻塞式功能，建议在 setup 函数中，通过向 agent 添加 EventListener 来实现；
(2) 如果有必须在向大模型发起请求之前完成的阻塞式功能，可以在 queryToLLM 中实现，但需要考虑性能问题；
(3) ./silicon-plugins 中提供了我们预制的一些插件，其中有一部分包含文档，可供参考；而 ./local-plugins 目录专门用于存放第三方开发者自定义的插件。

## 3. silicon-plugins
silicon-plugins 是我们为 SiliconVTuberCore 设计的一些插件，可以根据需要选用。
它们的功能如下：

| 名称 | 功能 |
|-----|-----|
| ActionQueue | 控制动作 (如播放音频、启动 Live2D 动作等) 的顺序执行、控制动作所需资源 (如 TTS 音频) 的获取 |
| L2dDisplay | 基于 pixi-live2d-display，控制 Live2D 模型展示、Live2D 动作与表情设置、 Live2D 口型同步等 |
| BatteryStatus | 监测电脑的电源状况 (是否在充电、当前电量)，并反馈给大模型。需要配合后端 /ai-vtuber-support/BilibiliWatcher |
| BilibiliDanmuku | 监测 bilibili 直播间弹幕和礼物信息，并反馈给大模型 |
| LatexPlugin | 基于 katex，用于渲染大模型输出的 LaTeX 公式 |
| LongTermMemory | 长期记忆模块。需要配合后端 /ai-vtuber-support/memory-manager |
| MinecraftPlugin | 基于 mineflayer，提供 Minecraft 动作命令，向大模型反馈 Minecraft 游戏状态。需要配合后端 /ai-vtuber-support/minecraft-interface |
| SubtitlePlugin | 控制字幕显示 (将大模型输出的文本以字幕的方式显示)，也提供了字幕翻译的功能 |

