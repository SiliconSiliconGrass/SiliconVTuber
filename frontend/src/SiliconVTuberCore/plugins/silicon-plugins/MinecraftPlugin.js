import AbstractPlugin from '../AbstractPlugin';

const URL = "http://127.0.0.1:7211/";

/**
 * Minecraft 插件
 */
export class MinecraftProxy extends AbstractPlugin {
    constructor() {
        super();
    }

    setAction(action) {
        fetch(URL + 'setAction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: action
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    async getStatus() {
        const response = await fetch(URL + 'getStatus');
        const json = await response.json();
        const status = json.status;
        return status;
    }

    setup(agent) {
        this.parent = agent;

        agent.addEventListener('end_of_query', (e) => {
            console.log('end_of_query', e);
            const response = e.detail.response || '';

            // set action at end of response

            if (response.includes('[goToPlayer]')) {
                this.setAction({
                    name: 'goToPlayer',
                    params: ['IndexError']
                });
            }

            if (response.includes('[defendSelf]')) {
                this.setAction({
                    name: 'defendSelf',
                    params: []
                });
            }

            if (response.includes('[mineDiamond]')) {
                this.setAction({
                    name: 'collectBlock',
                    params: ['diamond_ore', 1]
                });
            }

        })
    }

    async queryToLLM(agent, userInput) {
        const status = await this.getStatus();
        return '(Below is Minecraft game status. DO NOT READ THIS!)' + status + '\n';
    }
}