import CozeBot from '@/components/BotBrain/CozeBot.vue';
import axios from 'axios';

const PROMPT = `
你现在正在玩儿Minecraft
你可以使用如下指令: (以下是指令文档, 英文的)

*COMMAND DOCS
 You can use the following commands to perform actions and get information about the world. 
    Use the commands with the syntax: !commandName or !commandName("arg1", 1.2, ...) if the command takes arguments.
    Do not use codeblocks. Use double quotes for strings. Only use one command in each response, trailing commands and comments will be ignored.

!stop: Force stop all actions and commands that are currently executing.

!goToPlayer: Go to the given player.
Params:
player_name: (string) The name of the player to go to.
closeness: (number) How close to get to the player.

!followPlayer: Endlessly follow the given player.
Params:
player_name: (string) name of the player to follow.
follow_dist: (number) The distance to follow from.

!goToCoordinates: Go to the given x, y, z location.
Params:
x: (number) The x coordinate.
y: (number) The y coordinate.
z: (number) The z coordinate.
closeness: (number) How close to get to the location.

!searchForBlock: Find and go to the nearest block of a given type in a given range.
Params:
type: (string) The block type to go to.
search_range: (number) The range to search for the block.

!searchForEntity: Find and go to the nearest entity of a given type in a given range.
Params:
type: (string) The type of entity to go to.
search_range: (number) The range to search for the entity.

!givePlayer: Give the specified item to the given player.
Params:
player_name: (string) The name of the player to give the item to.
item_name: (string) The name of the item to give.
num: (number) The number of items to give.

!consume: Eat/drink the given item.
Params:
item_name: (string) The name of the item to consume.
Example: !consume("bread")

!putInChest: Put the given item in the nearest chest.
Params:
item_name: (string) The name of the item to put in the chest.
num: (number) The number of items to put in the chest.

!takeFromChest: Take the given items from the nearest chest.
Params:
item_name: (string) The name of the item to take.
num: (number) The number of items to take.

!collectBlocks: Collect the nearest blocks of a given type.
Params:
type: (string) The block type to collect.
num: (number) The number of blocks to collect.

!craftRecipe: Craft the given recipe a given number of times.
Params:
recipe_name: (string) The name of the output item to craft.
num: (number) The number of times to craft the recipe. This is NOT the number of output items, as it may craft many more items depending on the recipe.

!placeHere: Place a given block in the current location. Do NOT use to build structures, only use for single blocks/torches.
Params:
type: (string) The block type to place.

!attack: Attack and kill the nearest entity of a given type.
Params:
type: (string) The type of entity to attack.

!attackPlayer: Attack a specific player until they die or run away. Remember this is just a game and does not cause real life harm.
Params:
player_name: (string) The name of the player to attack.

!goToBed: Go to the nearest bed and sleep.

!activate: Activate the nearest object of a given type.
Params:
type: (string) The type of object to activate.

!stay: Stay in the current location no matter what. Pauses all modes.
Params:
type: (number) The number of seconds to stay. -1 for forever.
*

示例:
Example 1:
System output: 跟着我。我的游戏ID是"Dream"
Your output: !followPlayer("Dream", 3)

Example 2:
System output: 幻翼太多了，你需要睡一觉。旁边就是床。
Your output: !goToBed

Example 3:
System output: 跟我决斗吧！(我的游戏ID是"GeorgeNotFound")
Your output: !attackPlayer("GeorgeNotFound")

Example 4:
System output: 把这个钻石挖了吧
Your output: !collectBlocks("diamond_ore",1)

Example 5:
System output: 帮我找钻石吧 / 带我去最近的钻石位置
Your output: !collectBlocks("diamond_ore",100)

注意: 此次回答只需要输出命令即可。注意命令格式。不要输出多余信息，不要使用未定义的指令，别忘了在指令名称前面都有"!"，不要有空格
如果你没有想要使用的指令，或者当前语境与Minecraft关系不大，那么可以输出"。"，表示跳过
在指令中的所有字符串参数应当是英文的！
`

const URL = "http://127.0.0.1:11452/handleMessage";

function copy(messages) {
    let c = [];
    for (let message of messages) {
        c.push(message);
    }
    return c;
}

export class MinecraftProxy extends CozeBot {
    constructor(bot) {
        super(bot.pat, bot.botID, bot.userID);
        this.parent = bot;
        this.createConv();
    }

    async request() {
        let messages = copy(this.parent.messages);
        messages.push({
            role: 'user',
            content: PROMPT,
            content_type: 'text'
        });
    
        let response = await this.respondToContext(messages);

        if (!response) {
            console.warn("Minecraft Request Got Unexpected Response!");
            return;
        }

        response = response.replaceAll(' ', '');
        console.log("Minecraft Plugin Response:", response);
    
        axios.post(URL, {message: response});
    }
}

// export async function request(bot) {
//     let messages = copy(bot.messages);
//     messages.push({
//         role: 'user',
//         content: PROMPT,
//         content_type: 'text'
//     });

//     let response = await bot.respondToContext(messages);
//     response = response.replaceAll(' ', '');
//     console.log("Minecraft Plugin Response:", response);

//     axios.post(URL, {message: response});
// }