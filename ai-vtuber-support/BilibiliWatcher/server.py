from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json
import logging

app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)

# 设置 CORS，允许特定来源的跨域请求
CORS(app, resources={
    "/*": {  # 匹配所有路由
        "origins": ["http://localhost:8080"],  # 允许的域名
        "methods": ["GET", "POST", "PUT", "DELETE"],  # 允许的方法
        "allow_headers": ["Content-Type", "Authorization"],  # 允许的请求头
    }
})

midFactory = 0
def mid():
    global midFactory
    midFactory += 1
    return midFactory

'''
API routes
'''
messages = []

@app.route('/newMessage', methods=['post'])
def getAllMemory():
    global messages
    data = json.loads(request.data.decode('utf-8'))
    app.logger.info(f'New message received: {data}')
    message = data['message']
    message['id'] = mid()
    messages.append(message)
    return 'OK', 200

@app.route('/getMessages', methods=['get'])
def getMessages():
    global messages
    return json.dumps(messages), 200

if __name__ == '__main__':
    app.run(port=5252, debug=True)
