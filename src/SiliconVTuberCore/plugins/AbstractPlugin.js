import AbstractAgent from "../Agent/AbstractAgent";

/** @typedef {AbstractAgent} Agent */

/**
 * 插件的抽象基类
 * 
 * 子类需要实现 setup(agent) 和 queryToLLM(agent, userInput) 两个方法
 */
export default class AbstractPlugin extends EventTarget {
    constructor(config) {
        super();
        // do nothing
    }

    /**
     * 将插件挂载到Agent对象上 (可以在此处使用 EventListener 设置不阻塞 Agent.mainLoop 的处理逻辑)
     * @param {Agent} agent parent agent
     */
    setup(agent) {
        throw new Error("Abstract method 'setup' must be implemented by subclass");
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
        throw new Error("Abstract method 'queryToLLM' must be implemented by subclass");
    }
}