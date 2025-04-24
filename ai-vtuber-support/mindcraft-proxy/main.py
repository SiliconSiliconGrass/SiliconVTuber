# whisper server main
import os
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import json

app = Flask(__name__)

# 设置 CORS，允许所有来源的跨域请求
CORS(app, resources={
    "/*": {
        "origins": "*",  # 允许的域名
        "methods": ["GET", "POST", "PUT", "DELETE"],  # 允许的方法
        "allow_headers": ["Content-Type", "Authorization"],  # 允许的请求头
    }
})

@app.route('/chat', methods=['POST'])
def translateAPI():
    params = json.loads(request.data.decode('utf-8'))
    app.logger.info(str(params))
    result = 'Hello.'

    return jsonify({'message': {'content': result}}), 200

if __name__ == '__main__':
    app.run(port=11451, debug=True)
