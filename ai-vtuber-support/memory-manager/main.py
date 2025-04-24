# memory server main
import os
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
from MemoryBank import *
import json
from datetime import datetime
import logging

MEMORY_FILE_PATH = './memory.json'

app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)

memoryBank = MemoryBank()
try:
    memoryBank.load(MEMORY_FILE_PATH)
except FileNotFoundError as e:
    with open(MEMORY_FILE_PATH, 'w') as f:
        f.write('')
    memoryBank.load(MEMORY_FILE_PATH)

app.logger.info('Memory Server Ready!')
app.logger.info(f'Current Memories:\n{memoryBank}')

# 设置 CORS，允许特定来源的跨域请求
CORS(app, resources={
    "/*": {  # 匹配所有路由
        "origins": ["http://localhost:8080"],  # 允许的域名
        "methods": ["GET", "POST", "PUT", "DELETE"],  # 允许的方法
        "allow_headers": ["Content-Type", "Authorization"],  # 允许的请求头
    }
})

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
    app.logger.info('Memory Saved!')

'''
API routes
'''
@app.route('/getAllMemory', methods=['GET'])
def getAllMemory():
    global memoryBank
    return memoryBank.recallJSON(), 200

@app.route('/appendMemory', methods=['POST'])
def appendMemory():
    global memoryBank
    newMemories = json.loads(request.data.decode('utf-8'))
    for m in newMemories:
        content = m
        time = currTimeLabel()
        strength = 1.0
        resilience = 0.5
        memoryBank.add(Memory(content=content, time=time, strength=strength, resilience=resilience, memoryId=None))
    app.logger.info(f'Added new memories: {newMemories}')
    app.logger.info(str(memoryBank))
    saveMemory()
    return 'ok', 200

@app.route('/stepMemoryParams', methods=['POST'])
def stepMemoryParams():
    global memoryBank
    # TODO: try-except
    relatedMemoryIds = json.loads(request.data.decode('utf-8'))
    for memoryId in memoryBank.memoryIdList:
        if memoryId in relatedMemoryIds:
            memoryBank.getMemoryById(memoryId).reinforce()
        else:
            memoryBank.getMemoryById(memoryId).fade()
    saveMemory()
    return 'ok', 200

if __name__ == '__main__':
    app.run(port=8082, debug=True)
