<script>
import CozeBot from '../BotBrain/CozeBot.vue';

const msgDelta = (self, data) => {
    self.response += data['content'];
};

function copy(messages) {
    let c = [];
    for (let message of messages) {
        c.push(message);
    }
    return c;
}

const memoryWriterMessage = `
[系统提示] 你可以选择创建新记忆
你需要根据语境，判断需要被记住的一条或多条记忆内容（以你的视角第一人称叙述），将它们以一个JSON字符串数组(Array<String>)的形式输出出来。

例如：
假如用户刚刚告知你，他的名字叫做“小明”
期待的输出：“["用户的名字叫小明"]”

注意：
1. 此次不要输出多余的信息;
2. 严格按照JSON格式，如果认为没有值得创建的记忆，就将回答“[]”，如果只想创建一条记忆，则也要回答一个长度为1的字符串数组;
3. 已有的记忆不必再次写入
你当前的记忆如下: %MEMORY%
`;


export default class MemoryWriter extends CozeBot {
    /**
     * Memory Writing Agent (creates new memories)
     * @param pat coze token for bot brain
     * @param botID coze bot id for bot brain
     * @param userID coze user id (any string, except empty)
     */
    constructor(pat, botID, userID, memoryServer) {
        var eventCallBacks = {
            'conversation.message.delta': msgDelta,
            // 'done': responseDone
        }
        super(pat, botID, userID, eventCallBacks);

        if (!memoryServer) memoryServer = 'http://127.0.0.1:8082/';
        this.url = memoryServer;
        this.createConv(); // 初始化时自动创建ConvID, 以提高首句生成速度
    }

    async createNewMemories(messages, currMemory) {
        /**
         * Create new memories
         * @param messages Array<Object>
         */
        let memoryWriterMessages = copy(messages);
        memoryWriterMessages.push({
            role: 'user',
            content: memoryWriterMessage.replaceAll('%MEMORY%', JSON.stringify(currMemory)),
            content_type: 'text'
        });

        
        let response = await this.respondToContext(memoryWriterMessages);
        console.log('memory writer got messages:', memoryWriterMessages);
        console.log('new memories:', response);

        if (response === '[]') return; // 没有新记忆，不必写入

        response = await fetch(this.url + 'appendMemory', {
            method: 'POST',
            body: response,
            mode: 'cors', // 跨域请求
        });
        console.log(response);
    }
}

</script>