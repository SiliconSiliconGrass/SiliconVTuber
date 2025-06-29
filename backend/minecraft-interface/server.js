import express from 'express';
import cors from 'cors';
import SiliconMinecraftAgent from './SiliconMinecraftAgent.js';

const app = express();
const agent = new SiliconMinecraftAgent('Misaka');
// agent.addEventListener('spawn', () => {
//     setInterval(() => {console.log(agent.getStatus());}, 1000)
// })

// 配置CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// 获取当前状态信息
app.get('/getStatus', (req, res) => {
  try {
    res.json({status: agent.getStatus()});
  } catch (e) {
    console.log('An error occurred when getting status.', e);
    res.status(500).send('Server Error');
  }
});

// 设置动作
app.post('/setAction', (req, res) => {
  try {
    console.log(req.body);
    agent.setAction(req.body.action);
    res.status(200).send('Action set successfully');
  } catch (e) {
    console.log('An error occurred when setting action.', e);
    res.status(500).send('Server Error');
  }
});

// 404 处理器
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 启动服务器
const port = 7211;
app.listen(port, () => {
  console.log('API server running on port', port);
  console.log('Available endpoints:');
  console.log('POST /setAction');
  console.log('GET /getStatus');
});
