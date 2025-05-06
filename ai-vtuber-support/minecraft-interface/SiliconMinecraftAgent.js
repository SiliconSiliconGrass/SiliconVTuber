
import { createBot } from 'mineflayer';
import prismarine_items from 'prismarine-item';
import { pathfinder } from 'mineflayer-pathfinder';
import { plugin as pvp } from 'mineflayer-pvp';
import { plugin as collectblock } from 'mineflayer-collectblock';
import { plugin as autoEat } from 'mineflayer-auto-eat';
import plugin from 'mineflayer-armor-manager';
import * as world from './library/world.js'
import * as mc from "./library/mcdata.js";
import * as skills from './library/skills.js';

const armorManager = plugin;

// const mineflayer = require('mineflayer');
// const pathfinder = require('mineflayer-pathfinder');
// const pvp = require('mineflayer-pvp');
// const collectblock = require('mineflayer-collectblock');
// const autoEat = require('mineflayer-auto-eat');

// import { plugin as pvp } from 'mineflayer-pvp';
// import { plugin as collectblock } from 'mineflayer-collectblock';
// import { plugin as autoEat } from 'mineflayer-auto-eat';


function initBot(username) {
    const botConfig = {
        username: username,
        host: '8.142.124.11',
        port: 51401,
        auth: 'offline',

        version: '1.19.2',
    };
    let bot = createBot(botConfig);

    console.log(botConfig);

    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvp);
    bot.loadPlugin(collectblock);
    bot.loadPlugin(autoEat);
    bot.loadPlugin(armorManager); // auto equip armor
    bot.once('resourcePack', () => {
        bot.acceptResourcePack();
    });

    bot.once('spawn', () => {
        console.log('Bot spawned!');
    })

    return bot;
}

export default class SiliconMinecraftAgent extends EventTarget {
    constructor(botName = 'Misaka') {
        super();

        let bot = initBot(botName);

        bot.once('spawn', () => {
            this.dispatchEvent(new CustomEvent('spawn'));
        });

        this.bot = bot;
    }

    setAction(action) {
        if (!action || !action.name || !action.params) return;
        const actionName = action.name;
        
        try {
            if (actionName === 'goToPlayer') {
                if (!Array.isArray(action.params) || action.params.length === 0) return;
                const playerName = action.params[0];
                skills.goToPlayer(this.bot, playerName, 1.5);
            } else if (actionName === 'defendSelf') {
                skills.defendSelf(this.bot, 9);
            } else if (actionName === 'collectBlock') {
                if (!Array.isArray(action.params) || action.params.length < 2) return;
                const params = action.params;
                skills.collectBlock(this.bot, params[0], params[1]);
            }
        } catch(e) {
            console.log('An error occurred when trying to do action', action, '.');
            console.log(e);
        }
        
    }

    getStatus() {
        const bot = this.bot;
        let res = '当前Minecraft游戏状态:';
        let pos = bot.entity.position;
        // display position to 2 decimal places
        res += `\n- 你的坐标: x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z: ${pos.z.toFixed(2)}`;
        // Gameplay
        res += `\n- 你的游戏模式: ${bot.game.gameMode}`;
        res += `\n- 你的生命值: ${Math.round(bot.health)} / 20`;
        res += `\n- 你的饱和度: ${Math.round(bot.food)} / 20`;
        res += `\n- 所处生物群系: ${world.getBiomeName(bot)}`;
        let weather = "Clear";
        if (bot.rainState > 0)
            weather = "Rain";
        if (bot.thunderState > 0)
            weather = "Thunderstorm";
        res += `\n- 当前天气: ${weather}`;
        // let block = bot.blockAt(pos);
        // res += `\n- Artficial light: ${block.skyLight}`;
        // res += `\n- Sky light: ${block.light}`;
        // light properties are bugged, they are not accurate
        // res += '\n- ' + world.getSurroundingBlocks(bot).join('\n- ')
        // res += `\n- First Solid Block Above Head: ${world.getFirstBlockAboveHead(bot, null, 32)}`;


        if (bot.time.timeOfDay < 6000) {
            res += '\n- 当前时间: Morning';
        } else if (bot.time.timeOfDay < 12000) {
            res += '\n- 当前时间: Afternoon';
        } else {
            res += '\n- 当前时间: Night';
        }

        // get the bot's current action
        // let action = agent.actions.currentActionLabel;
        // if (agent.isIdle())
        //     action = 'Idle';
        // res += `\- Current Action: ${action}`;


        let players = world.getNearbyPlayerNames(bot);
        // let bots = convoManager.getInGameAgents().filter(b => b !== agent.name);
        // players = players.filter(p => !bots.includes(p));

        res += '\n- 你附近的玩家: ' + (players.length > 0 ? players.join(', ') : '(附近无玩家).');
        // res += '\n- Nearby Bot Players: ' + (bots.length > 0 ? bots.join(', ') : 'None.');

        // res += '\n' + agent.bot.modes.getMiniDocs() + '\n';

        let enemy = world.getNearestEntityWhere(bot, entity => mc.isHostile(entity), 5); // 检测附近5格内的怪物
        if (enemy) {
            res += '附近有怪物向你袭来！！！'
        }

        return res;
    }
}


// // Sample of use
// const agent = new SiliconMinecraftAgent('Misaka');
// agent.addEventListener('spawn', () => {
//     agent.setAction({
//         name: 'goToPlayer',
//         params: ['IndexError']
//     })
// })