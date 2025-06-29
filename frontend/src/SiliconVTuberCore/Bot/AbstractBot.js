/**
 * Abstract Bot Class
 */
export default class AbstractBot extends EventTarget {
    constructor() {
        super();
        /** @type {Array<{role: 'system' | 'user' | 'assistant', content: string}} */
        this.messages = [];
    }

    /**
     * 添加对话上下文到 this.messages
     * @param {string} text 对话内容
     * @param {'user' | 'assistant'} role 身份
     */
    appendContext(text, role = 'user') {
        this.messages.push({
            role: role,
            content: text,
            content_type: "text"
        });
    }
    
    async setup() {
        throw new Error("Abstract method 'setup' must be implemented by subclass");
    }

    /**
     * To send a chat message to LLM bot, and return its response
     * @param {string} message
     */
    async respondTo(message) {
        throw new Error("Abstract method 'respondTo' must be implemented by subclass");
    }

    /**
     * To send recorded history messages to LLM bot, and return its response
     * @param {Array<{role: 'system' | 'user' | 'assistant', content: string}>} messages recorded history messages
     */
    async respondToContext(messages) {
        throw new Error("Abstract method 'respondToContext' must be implemented by subclass");
    }
}