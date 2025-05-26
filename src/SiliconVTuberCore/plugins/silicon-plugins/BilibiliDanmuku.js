import axios from "axios";
import AbstractPlugin from "../AbstractPlugin";

/**
 * 生成一个弹幕显示元素
 * @param {{content: string, username: string}} danmuku 弹幕对象
 * @returns {HTMLDivElement}
 */
function makeDanmuku(danmuku) {
    const danmukuContainer = document.createElement('div');
    danmukuContainer.style.position = 'relative';
    danmukuContainer.style.opacity = '0';
    danmukuContainer.style.transform = 'translateX(-100px)';
    danmukuContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    danmukuContainer.style.marginLeft = '10%';
    danmukuContainer.style.marginRight = '10%';
    danmukuContainer.style.marginTop = '5%';
    danmukuContainer.style.marginBottom = '5%';
    danmukuContainer.style.borderRadius = '10px';
    danmukuContainer.style.background = 'white';
    danmukuContainer.style.textAlign = 'left';
    danmukuContainer.style.paddingTop = '10px';
    danmukuContainer.style.paddingBottom = '10px';
    danmukuContainer.style.paddingLeft = '30px';
    danmukuContainer.style.paddingRight = '30px';
    danmukuContainer.innerHTML = `<span style="color: #4048e9; font-weight: 1000">${danmuku.username}</span><br><span>${danmuku.content}</span>`;
    return danmukuContainer;
}

/**
 * Bilibili 直播弹幕插件
 * 与后端服务器沟通，间接监听直播间的弹幕，并引导AI VTuber做出回应
 * @param {string} url 后端服务器url
 */
export default class BilbiliDanmuku extends AbstractPlugin {
    /**
     * 
     * @param {string} url 后端url
     * @param {boolean} display 是否在页面上显示弹幕列表
     * @param {HTMLDivElement} displayArea 弹幕列表显示区域
     * @param {string} language 语言，默认为'zh'，支持'zh'和'ja'
     */
    constructor({url, display=false, displayArea=null, language='zh'}) {
        super();
        this.url = url || 'http:/127.0.0.1:5252/'
        this.display = display;
        this.displayArea = displayArea;

        this.messages = [];
        this.messageIds = [];
        this.newMessages = [];

        this.language = language;
    }

    /**
     * 向显示区域添加弹幕
     * @param {{content: string, username: string}} danmuku 弹幕对象
     */
    showDanmuku(danmuku) {
        // TODO
        console.log(danmuku);
        if (this.display && this.displayArea) {
            // 将弹幕添加到display
            const danmukuElement = makeDanmuku(danmuku);
            this.displayArea.appendChild(danmukuElement);
            setTimeout(() => {
                danmukuElement.style.opacity = 1;
                danmukuElement.style.transform = 'translateY(0)';
            });
            this.displayArea.scrollTo({
                top: this.displayArea.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    setup(agent) {
        this.parent = agent;

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
                            this.showDanmuku(message);
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

        // for (let danmuku of this.newMessages) {
        //     this.showDanmuku(danmuku);
        // }

        if (this.newMessages.length === 0) {
            return '';
        }

        let danmukuPrompt = '';

        if (this.language === 'zh') {
            danmukuPrompt = '【追加任务】收到了直播间观众的弹幕，请先朗读弹幕（如果语言不同，请先翻译，然后读出翻译结果），再针对弹幕作出回应。弹幕如下：\n';
            for (let danmuku of this.newMessages) {
                danmukuPrompt += `弹幕内容: ${danmuku.content} （来自用户“${danmuku.username}”）\n`;
            }
        } else if (this.language === 'ja') {
            danmukuPrompt = '【追加タスク】配信の視聴者からコメントが届きました。まずコメントを読み上げてください（言語が異なる場合は、まず翻訳してから翻訳結果を読み上げてください）。その後、コメントに対して返答してください。コメント内容は以下の通り：\n';
            for (let danmuku of this.newMessages) {
                danmukuPrompt += `コメント内容: ${danmuku.content} （ユーザー「${danmuku.username}」より）\n`;
            }
        } else {
            throw new Error('Language not supported');
        }

        
        this.newMessages = [];
        return danmukuPrompt;
    }
}