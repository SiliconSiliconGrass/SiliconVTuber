import AbstractPlugin from "../AbstractPlugin";

/**
 * 电源插件
 * 监测电源插拔、提供当前电量信息
 */
export default class BatteryStatus extends AbstractPlugin {
    constructor() {
        super();
    }

    setup(agent) {
        if (this.agent) {
            console.warn('This plugin is already initialized! Do not call setup() again!');
            return;
        }
        this.agent = agent;

        navigator.getBattery().then((battery) => {
            battery.addEventListener('chargingchange', () => {
                if (battery.charging) {
                    agent.userInputBuffer.push("[系统提示: 用户插上了电脑电源，你开始充电了，感觉非常舒爽！]");
                } else {
                    agent.userInputBuffer.push("[系统提示: 用户拔出了电脑电源，你快没电了！你很慌张，怎么办？！]");
                }
            });
        });
    }

    async queryToLLM(agent, userInput) {
        let battery = await navigator.getBattery();
        let batteryLevel =`${Math.round(battery.level * 100)}%`;
        return `当前电源电量: ${batteryLevel}\n`;
    }
}
