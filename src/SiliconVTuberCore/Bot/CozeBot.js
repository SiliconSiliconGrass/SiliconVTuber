import axios from 'axios';
import AbstractBot from './AbstractBot';

export default class CozeBot extends AbstractBot {
    /**
     * A delegate used to communicate with coze api
     * @param pat coze token
     * @param botID coze bot id
     * @param userID coze user id (any string, except empty)
     */
    constructor(pat, botID, userID) {
        super();

        this.pat = pat;
        this.botID = botID;
        this.userID = userID;
        this.convID = null;
        this.response = '';
        this.buffer = '';

        this.messages = []; // 在本地记录聊天记录
    }

    processEvent(eventType, data) {
        // if (eventType in this.eventCallBacks) {
        //     this.eventCallBacks[eventType](this, data);
        // }

        if (eventType === 'conversation.message.delta') {
            this.dispatchEvent(new CustomEvent('message_delta', {
                detail: {content: data.content}
            }));
        } else if (eventType === 'done') {
            this.dispatchEvent(new CustomEvent('done'));
        }

        if (eventType === 'done') {
            return 'quit';
        }
    }

    async setup() {
        await this.createConv();
    }

    async createConv() {
        /**
         * To set a conversation id for this bot
         * This function will be called automatically in "respondTo()" if current convID is null
         * But it is recommended to manually call it in advance
         */
        return new Promise((resolve, reject) => {
            const url = 'https://api.coze.cn/v1/conversation/create';
            const headers = {
                'Authorization': `Bearer ${this.pat}`,
                'Content-Type': 'application/json',
            };

            axios.post(url, {}, { headers })
                .then(response => {
                    this.convID = response.data.data.id;
                    resolve();
                })
                .catch(error => {
                    console.error('Error creating conversation:', error);
                    reject(error);
                });
        });
    }

    async respondTo(message, auto_save_history=false) {
        /**
         * To send a chat message to coze bot, and return its response
         * @param message [string]
         */
        if (!this.convID) {
            await this.createConv(); // 这是创建会话的方法
        }

        const url = `https://api.coze.cn/v3/chat?conversation_id=${this.convID}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.pat, // 认证令牌
        };

        const data = {
            bot_id: this.botID,
            user_id: this.userID,
            stream: true,
            auto_save_history: auto_save_history,
            additional_messages: [
                {
                    role: "user",
                    content: message,
                    content_type: "text"
                }
            ]
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

                    if (line.startsWith('event:')) {
                        eventType = line.slice(6);
                    } else if (line.startsWith('data:')) {
                        try {
                            const data = JSON.parse(line.slice(5));
                            const res = this.processEvent(eventType, data);
                            if (res === 'quit') {
                                reader.cancel();
                                return this.response;
                            }
                        } catch(e) {
                            console.error('[CozeBot] An error occurred when is parsing event data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    appendContext(text, role = 'user') {
        this.messages.push({
            role: role,
            content: text,
            content_type: "text"
        });
    }

    async respondToContext(messages) {
        /**
         * To send recorded history messages to coze bot, and return its response
         * @param messages recorded history messages (Array<Object>)
         */

        if (!this.convID) {
            await this.createConv(); // 这是创建会话的方法
        }

        if (!messages) {
            messages = this.messages;
        }

        const url = `https://api.coze.cn/v3/chat?conversation_id=${this.convID}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.pat, // 认证令牌
        };

        const data = {
            bot_id: this.botID,
            user_id: this.userID,
            stream: true,
            auto_save_history: false,
            additional_messages: messages.slice(-50) // 最多保留50条历史
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

                    if (line.startsWith('event:')) {
                        eventType = line.slice(6);
                    } else if (line.startsWith('data:')) {
                        try {
                            const data = JSON.parse(line.slice(5));
                            const res = this.processEvent(eventType, data);
                            if (res === 'quit') {
                                reader.cancel();
                                return this.response;
                            }
                        } catch(e) {
                            console.error('[CozeBot] An error occurred when is parsing event data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
}