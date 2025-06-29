# memory server main
import os
import json
from MemoryBank import *
import json
from datetime import datetime
import logging

MEMORY_FILE_PATH = './memory.json'


memoryBank = MemoryBank()
# try:
#     memoryBank.load(MEMORY_FILE_PATH)
# except FileNotFoundError as e:
#     with open(MEMORY_FILE_PATH, 'w') as f:
#         f.write('')
#     memoryBank.load(MEMORY_FILE_PATH)

'''
global functions
'''
def currTimeLabel():
    # 获取当前时间
    current_time = datetime.now()
    current_time_str = current_time.strftime("%Y-%m-%d %H:%M:%S")
    return current_time_str

def saveMemory():
    global memoryBank, MEMORY_FILE_PATH
    memoryBank.save(MEMORY_FILE_PATH)
    # app.logger.info('Memory Saved!')


memoryBank.add(Memory(content="你正在跟IndexError玩儿Minecraft。IndexError是用户在Minecraft中的游戏ID，你需要好好配合他玩儿Minecraft", time="now", strength=1.0, resilience=1.0, memoryId=None))
saveMemory()

