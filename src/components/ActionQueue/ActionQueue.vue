<script>
export class Action {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

export default class ActionQueue {
    constructor(parent) {
        this.queue = [];
        this.busy = false;
        this.parent = parent; // 关联Bot
        this.audioGenInterval = 0;

        this.lastAudioGenTime = null;
        this.timeoutId = null;

        this.mainLoop();
    }

    enqueue(action) {
        this.queue.push(action);
        // this.activate(); // 在入队时尝试执行
    }

    dequeue() {
        return this.queue.shift();
    }

    length() {
        return this.queue.length;
    }

    async mainLoop() {
        const INTERVAL = 100; // (ms)

        // console.log(`ActionQueue mainLoop alive! Actions: ${this.queue}`);

        while (this.length() > 0) {
            let action = this.queue[0]; // 先不dequeue，因为可能由于resource不全而执行失败
            if (action.resources) {

                // 如果有尚未就绪的resource，则暂不执行action
                let ready = true;
                for (let resource of action.resources) {
                    if (!resource.ready) {
                        ready = false;
                        break;
                    }
                }
                if (!ready) break;

                // 执行action
                await this.doAction(action);
                this.dequeue(); // 出队
            }
        }

        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(async() => {await this.mainLoop()}, INTERVAL);
    }

    async doAction(action) {

        console.log('do action:', action);

        if (action.type === 'SayAloud') {
            await this.parent.resourceManager.playAudio(action.resources[0], false); // 播放音频，播放结束后不删除
            // 等到一段话结束时再删除所有音频，减小性能开支
        }

        if (action.type === 'EndOfResponse') {
            this.parent.resourceManager.clearResources();
            this.queue = [];
        }
    }
}

</script>