import { GetBotFromConfig } from "@/components/Bot/BotUtils";
import AbstractPlugin from "../AbstractPlugin";
import axios from "axios";

const memoryFilterMessage = `[系统提示]
请你先从你的记忆库(JSON格式)中选择你可能需要用到的记忆
你需要根据语境，选择与你接下来的回答相关(或者你认为需要被长期记住)的一条或多条记忆内容，将它们的id以一个JSON整数数组(Array<Int>)的形式输出出来。

例如:
当前的语境: 用户正在问你想给他买什么好吃的作为礼物，而你决定给他买巧克力
你的记忆: [{"id":1,"content":"用户的名字叫做“小明”",{"id":2,"content":"小明喜欢吃巧克力"},{"id":3,"content":"用户夸我可爱"}]
期待的输出:“[1,2]”
解释: id为1的记忆表明了用户的姓名，属于需要长期记忆的信息，而你在与用户说话，因此需要强化这条记忆；id为2的记忆与用户的提问直接相关；id为3的记忆与语境关系不大
（该示例仅供参考，你可以根据你的个性来筛选所需记忆）

注意:
1. 此次不要输出多余的信息;
2. 严格按照JSON格式，如果认为没有需要用到的记忆，就将回答“[]”，如果认为一条记忆是需要用到的，则也要回答一个长度为1的整数数组

这是此次用户的输入: %USER_INPUT%
这是刚才你的回答: %AGENT_OUTPUT%
这是你的记忆库: %MEMORY%
无论你收到了多少个用户输入，每次只能输出一个数组！“[3][1,2][]”这样的回答是非法的！
不要添加任何形式的解释！必须输出且只输出JSON数组！`;

const memoryWriterMessage = `
[系统提示]
你需要根据语境，判断需要被长期牢记的一些记忆内容（以你的视角第一人称叙述）

例如：
假如用户刚刚告知你，他的名字叫做“小明”
期待的输出：“用户的名字叫小明”

注意：
1. 此次不要输出多余的信息;
2. 如果认为没有值得创建的记忆，就将回答“[]”;
3. 当前记忆中已经有的内容，不必再次重复;
4. 直接输出你想记忆的内容，而不要使用JSON格式.

你当前的记忆如下: %MEMORY%
刚才用户的输入: %USER_INPUT%
这是刚才你的回答: %AGENT_OUTPUT%
`;

function copy(messages) {
    let c = [];
    for (let message of messages) {
        c.push(message);
    }
    return c;
}


/**
 * @deprecated
 * 长期记忆插件
 * 测试效果不佳，暂时不启用
 */
export default class LongTermMemory extends AbstractPlugin {
    constructor(config) {
        super();
        let url = config.memoryServer;
        if (!url) {
            url = 'http://127.0.0.1:8082/';
        }
        if (url[url.length - 1] !== '/') url += '/'; // 保证url以斜杠结尾
        this.url = url;

        let botConfig = config.botConfig;
        let bot = GetBotFromConfig(botConfig);
        if (!bot) {
            throw new Error(`ValueError: Unsupported bot config! ${botConfig}`);
        }
        this.bot = bot;

        this.agent = null;
        this.memoryBank = null;
    }

    setup(agent) {
        if (this.agent) {
            console.warn('This plugin is already initialized! Do not call setup() again!');
            return;
        }
        this.agent = agent;
        agent.addEventListener('end_of_response', async () => {
            let recalledMemoriesIds = await this._getRecalledMemories(agent.bot.messages);
            this._reinforceMemories(recalledMemoriesIds);
            this._createNewMemories(agent.bot.messages);
        });

        this._getAllMemories().then((memories) => {this.memoryBank = memories}); // 初始化memoryBank
    }

    async queryToLLM(agent, userInput) {
        let query = '';
        for (let memory of this.memoryBank) {
            query += `记忆内容: ${memory.content}; 记忆时间: ${memory.time}\n`;
        }
        return `当前的记忆: ${query}\n`;
    }

    async _getAllMemories() {
        /**
         * 向Python后端发起请求，获取记忆
         */
        let response = await axios.get(this.url + '/getAllMemory');
        return response.data;
    }

    async _getRecalledMemories(messages) {
        /**
         * Get recalled memories
         * @param messages 聊天记录 Array<Object>
         */
        let memoryBank = this.memoryBank;

        let memoryFilterMessages = copy(messages);
        // memoryFilterMessages = memoryFilterMessages.slice(1);
        console.log(messages, memoryFilterMessages)

        let userInput = messages[messages.length - 2]; // 用户此次的输入内容
        let agentOutput = messages[messages.length - 1]; // 智能体此次的输出内容
        memoryFilterMessages.push({
            role: 'user',
            content: memoryFilterMessage.replaceAll('%MEMORY%', JSON.stringify(memoryBank))
                                        .replaceAll('%USER_INPUT%', JSON.stringify(userInput))
                                        .replaceAll('%AGENT_OUTPUT%', JSON.stringify(agentOutput)),
            content_type: 'text'
        });

        console.log('memory filter got messages:', memoryFilterMessages);

        let response = await this.bot.respondToContext(memoryFilterMessages);
        let recalledMemoryIds = [];
        try {
            recalledMemoryIds = JSON.parse(response);
        } catch(e) {
            console.warn(`[MemoryFileter] The agent didn't respond in JSON format! (Got response: "${response}")`);
        }
        return recalledMemoryIds;
    }

    async _createNewMemories(messages) {
        /**
         * Create new memories
         * @param messages Array<Object>
         */
        let memoryWriterMessages = copy(messages);

        let userInput = messages[messages.length - 2]; // 用户此次的输入内容
        let agentOutput = messages[messages.length - 1]; // 智能体此次的输出内容

        memoryWriterMessages.push({
            role: 'user',
            content: memoryWriterMessage.replaceAll('%MEMORY%', JSON.stringify(this.memoryBank))
                                        .replaceAll('%USER_INPUT%', JSON.stringify(userInput))
                                        .replaceAll('%AGENT_OUTPUT%', JSON.stringify(agentOutput)),
            content_type: 'text'
        });

        
        let response = await this.bot.respondToContext(memoryWriterMessages);
        console.log('memory writer got messages:', memoryWriterMessages);
        console.log('new memories:', response);

        let newMemories = [];
        // try {
        //     newMemories = JSON.parse(response);
        // } catch(e) {
        //     console.warn(`Memory Writer didn't respond in JSON format! (Got resposne: "${response}")`);
        // }

        if (response.includes("[]")) {
            newMemories = [];
        } else {
            newMemories = [response];
        }

        axios.post(this.url + 'appendMemory', newMemories)
        .catch((e) => {
            console.warn('An error occurred when trying to create new memories:', e);
        });
    }

    async _reinforceMemories(recalledMemoryIds) {
        /**
         * 强化被用到的记忆
         */
        axios.post(this.url + 'stepMemoryParams', recalledMemoryIds)
        .then(() => {
            this._getAllMemories().then((memories) => {this.memoryBank = memories}); // 更新记忆库
        })
        .catch((e) => {
            console.warn('An error occurred when trying to reinforce memories:', e);
        });
    }
}
