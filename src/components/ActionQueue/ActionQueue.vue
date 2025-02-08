<script>

function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// const MOTION_DICT = { // MOTION_DICT中存储了每隔动作的持续时间
//   'shy': 3500,
//   'comfy': 5000,
//   'touch_hat': 4600,
//   'draw_heart_success': 8000,
//   'draw_heart_failed': 10000,
//   'rabbit_magic': 9700,
// };

const MOTION_DICT = { // MOTION_DICT中存储了每隔动作的持续时间
  'shy': 1000,
  'comfy': 1000,
  'touch_hat': 2000,
  'draw_heart_success': 2000,
  'draw_heart_failed': 3000,
  'rabbit_magic': 2000,
};

const EXPRESSION_DICT = {
  'smile': 'exp_01',
  'smile_with_eyes_closed': 'exp_02',
  'close_eyes': 'exp_03',
  'stars_in_eyes': 'exp_04',
  'doubtful': 'exp_05',
  'blush': 'exp_06',
  'shocked': 'exp_07',
  'disdainful': 'exp_08'
}

export class Action {
    /**
     * @param type [string] type of action
     * @param data [Object] data of action
     */
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

export default class ActionQueue extends EventTarget {
    /**
     * A delegate used to manage and carry out actions
     * @param parent [Mao] parent chat bot
     */
    constructor(parent) {
        super();
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

    isEmpty() {
        return this.length() === 0;
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

        // console.log('doing action:', action);

        if (action.type === 'SayAloud') {
            try {
                await this.parent.resourceManager.playAudio(action.resources[0], false); // 播放音频，播放结束后不会立即删除
            } catch(e) {
                console.warn(`Skipping SayAloud Action (text: ${action.data}), because an error occurred:`, e);
            }
            
            // 等到一段话结束时再删除所有音频，减小性能开销
        }

        if (action.type === 'Expression/Motion') {
            let name = action.data;
            if (name in MOTION_DICT) {
                let event = new Event('launchMotion');
                event.motionName = name;
                document.getElementById('l2dEventTrigger').dispatchEvent(event);

                await delay(MOTION_DICT[name]); // MOTION_DICT中存储了每隔动作的持续时间

                // motionEnd的触发时机似乎不是很正确, 故弃用
                // return new Promise((resolve) => {
                //     document.getElementById('l2dCallbackTrigger').addEventListener('motionEnd', async () => {
                //         console.log('motionEnd!');
                //         resolve();
                //     }, { once: true }); // 该listener只触发一次
                // });

            } else if (name in EXPRESSION_DICT) {
                let event = new Event('setExpression');
                event.expressionName = name;
                document.getElementById('l2dEventTrigger').dispatchEvent(event);
            }
        }

        if (action.type === 'EndOfResponse' && this.queue.length === 1) {
            this.parent.resourceManager.clearResources();
            this.dispatchEvent(new Event('empty'));
        }
    }
}

</script>