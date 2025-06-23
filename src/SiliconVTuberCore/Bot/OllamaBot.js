import AbstractBot from "./AbstractBot";

export default class OllamaBot extends AbstractBot {
    /**
     * Abstract Bot Class
     */
    constructor(modelName) {
        super();
        this.modelName = modelName;
    }
    
    async setup() {
        return;
    }

    async respondToContext(messages) {
        if (!messages) {
            messages = this.messages;
        }

        const url = `http://localhost:11434/api/chat`;
        const headers = {
            'Content-Type': 'application/json',
            // 'Authorization': 'Bearer ' + this.pat, // 认证令牌
        };

        const data = {
            "model": this.modelName,
            "messages": messages,
            "stream": true
        };


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

            let True = true;
            while (True) {
                const { done, value } = await reader.read();

                let result = decoder.decode(value, { stream: true });

                if (done) {
                    // console.log('Stream complete');
                    break;
                }

                // Process the stream data
                try {
                    result = JSON.parse(result).message.content;
                } catch (e) {
                    result = '';
                    console.warn(e);
                }

                this.dispatchEvent(new CustomEvent('message_delta', {
                    detail: {content: result}
                }));
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }

        this.dispatchEvent(new CustomEvent('done'));
        return this.response;
    }
}