export default class AbstractAgent extends EventTarget {
    /**
     * Abstract Base Class For Agent
     */
    constructor() {
        super();
        this.plugins = [];
    }

    /**
     * 将聊天上下文传递给Agent
     * @param {[{role: 'user' | 'agent' | 'system', content: string}] | null} messages 聊天历史 （可选，为空时默认使用Agent的历史）
     */
    async respondToContext(messages) {
        throw new Error("Abstract method 'respondToContext' must be implemented by subclass");
    }
    
    /**
     * 向Agent记录的聊天历史中添加一条消息
     * @param {string} text 消息内容
     * @param {'user' | 'agent' | 'system'} role 消息角色
     */
    appendContext(text, role = 'user') {
        throw new Error("Abstract method 'appendContext' must be implemented by subclass");
    }

    /**
     * 挂载插件
     * @param {VTuberPlugin} plugin 插件对象（需提供setup方法）
     */
    addPlugin(plugin) {
        plugin.setup(this);
        if (!Array.isArray(this.plugins)) this.plugins = [];
        this.plugins.push(plugin);
    }
}