<script>
import axios from 'axios';

export default class CozeBot {
    constructor(pat, botID, userID, eventCallBacks) {
        this.pat = pat;
        this.botID = botID;
        this.userID = userID;
        this.convID = null;
        this.response = '';
        this.buffer = '';

        if (!eventCallBacks) {
            eventCallBacks = {
                'conversation.message.delta': (self, data) => { self.response += data['content'] },
            };
        }
        this.eventCallBacks = eventCallBacks;
    }

    processEvent(eventType, data) {
        if (eventType in this.eventCallBacks) {
            this.eventCallBacks[eventType](this, data);
        }

        if (eventType === 'done') {
            return 'quit';
        }
    }

    async createConv() {
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

    async respondTo(message) {
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
            auto_save_history: true,
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
}

// export default {
//     props: {
//         pat: {
//             type: String
//         },
//         botID: {
//             type: String
//         },
//         userID: {
//             type: String
//         },
//         eventCallBacks: {
//             type: Object
//         },
//     },

//     data() {
//         return {
//             bot: null
//         }
//     },

//     mounted() {
//         this.bot = new CozeBot(this.pat, this.botID, this.userID, this.eventCallBacks);
//     }
// }
</script>