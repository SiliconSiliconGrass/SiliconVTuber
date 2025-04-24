
import { createBot } from 'mineflayer';
import prismarine_items from 'prismarine-item';
import { pathfinder } from 'mineflayer-pathfinder';
import { plugin as pvp } from 'mineflayer-pvp';
import { plugin as collectblock } from 'mineflayer-collectblock';
import { plugin as autoEat } from 'mineflayer-auto-eat';
import plugin from 'mineflayer-armor-manager';
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
        port: 25565,
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

    console.log(bot.pathfinder);
}

main();