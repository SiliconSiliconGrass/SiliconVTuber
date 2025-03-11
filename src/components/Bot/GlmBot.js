import AbstractBot from './AbstractBot';

export default class GlmBot extends AbstractBot {
    /**
     * A delegate used to communicate with GLM-4 api
     * @param {String} token token
     * @param {String} modelName name of model (default: "glm-4-flash")
     */
    constructor(token, modelName, systemPrompt) {
        super();

        this.token = token;

        if (!modelName) modelName = 'glm-4-flash';
        this.modelName = modelName
        this.response = '';
        this.buffer = '';

        this.messages = []; // 在本地记录聊天记录

        if (systemPrompt) {
            this.appendContext(systemPrompt, 'system')
        }
    }

    async setup() {
        // do nothing...
    }

    appendContext(text, role = 'user') {
        this.messages.push({
            role: role,
            content: text,
        });
    }

    async respondToContext(messages) {
        /**
         * To send recorded history messages to coze bot, and return its response
         * @param {Array<Object>} messages recorded history messages (default: this.messages)
         */

        if (!messages) {
            messages = this.messages;
        }

        const url = `https://open.bigmodel.cn/api/paas/v4/chat/completions`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.token, // 认证令牌
        };

        const data = {
            'model': this.modelName,
            'messages': messages.slice(-50),
            'stream': true
        }

        this.response = '';

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data),
                mode: 'cors', // 跨域请求
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let eventType = null;
            let result = '';

            let True = true;
            while (True) {
                const { done, value } = await reader.read();

                result += decoder.decode(value, { stream: true });

                if (done) {
                    // console.log('Stream complete');
                    break;
                }

                // Process the stream data
                while (result.includes('\n')) {
                    const line = result.slice(0, result.indexOf('\n'));

                    // console.log(line);

                    result = result.slice(result.indexOf('\n') + 1);

                    if (line.startsWith('data:')) {
                        try {
                            const data = JSON.parse(line.slice(5));
                            
                            let deltaText = data.choices[0].delta.content;
                            if (!deltaText || deltaText == 'undefined') continue;
                            this.response += deltaText;
                            console.log({deltaText})
                            this.dispatchEvent(new CustomEvent('message_delta', {
                                detail: {content: deltaText}
                            }));
                        } catch(e) {
                            if (line.includes('[DONE]')) {
                                this.dispatchEvent(new CustomEvent('done'));
                                return this.response;
                            }
                            console.error('[CozeBot] An error occurred when is parsing event data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }

        this.dispatchEvent(new CustomEvent('done'));
    }
}