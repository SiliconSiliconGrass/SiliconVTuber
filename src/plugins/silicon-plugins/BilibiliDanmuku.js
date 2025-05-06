import axios from "axios";
import AbstractPlugin from "../AbstractPlugin";

export default class BilbiliDanmuku extends AbstractPlugin {
    constructor(url) {
        super();
        this.url = url || 'http:/127.0.0.1:5252/'
        this.messages = [];
        this.messageIds = [];
        this.newMessages = [];
    }

    showDanmuku(danmuku) {
        // TODO
        console.log(danmuku);
    }

    setup(agent) {
        this.parent = agent;
        agent.plugins.push(this);

        axios.get(this.url + 'getMessages')
        .then((response) => {
            const data = response.data;
            if (data && data.length > 0) {
                for (const message of data) {
                    if (this.messageIds.includes(message.id)) continue;
                    this.messageIds.push(message.id);
                    this.messages.push(message);
                }
            }
        })
        .catch((error) => {
            console.warn("Error fetching danmuku:", error);
        });

        this.loop = setInterval(() => {
            axios.get(this.url + 'getMessages')
                .then((response) => {
                    const data = response.data;
                    if (data && data.length > 0) {
                        for (const message of data) {
                            if (this.messageIds.includes(message.id)) continue;
                            this.messageIds.push(message.id);
                            this.newMessages.push(message);
                            this.messages.push(message);
                        }
                    }
                })
                .catch((error) => {
                    console.warn("Error fetching danmuku:", error);
                });
        }, 1000);
    }

    async queryToLLM(agent, userInput) {
        console.log('BilbiliDanmuku.queryToLLM', this.newMessages)

        for (let danmuku of this.newMessages) {
            this.showDanmuku(danmuku);
        }

        if (this.newMessages.length === 0) {
            return '';
        }

        let danmukuPrompt = '收到了以下新弹幕:\n';
        for (let danmuku of this.newMessages) {
            danmukuPrompt += `弹幕内容: ${danmuku.content} （来自用户“${danmuku.username}”）\n`;
        }
        this.newMessages = [];
        return danmukuPrompt;
    }
}