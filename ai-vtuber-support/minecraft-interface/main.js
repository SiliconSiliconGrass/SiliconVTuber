
import { createBot } from 'mineflayer';
import prismarine_items from 'prismarine-item';
import { pathfinder } from 'mineflayer-pathfinder';
import { plugin as pvp } from 'mineflayer-pvp';
import { plugin as collectblock } from 'mineflayer-collectblock';
import { plugin as autoEat } from 'mineflayer-auto-eat';
import plugin from 'mineflayer-armor-manager';

import { goToPlayer } from './library/skills.js';
import { initModes } from './modes.js';

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
    let bot = createBot({
        username: username,

        host: 'localhost',
        port: 54310,
        auth: 'offline',

        version: '1.19.2',
    });

    bot.loadPlugin(pathfinder);
    bot.loadPlugin(pvp);
    bot.loadPlugin(collectblock);
    bot.loadPlugin(autoEat);
    bot.loadPlugin(armorManager); // auto equip armor
    bot.once('resourcePack', () => {
        bot.acceptResourcePack();
    });

    return bot;
}

function main() {
    let bot = initBot("Misaka");
    initModes(bot);

    // console.log(bot.pathfinder);
    console.log('start to go to player');
    goToPlayer(bot, "IndexError", 3).then(() => {
        console.log('arrived at player');
    });
}

main();