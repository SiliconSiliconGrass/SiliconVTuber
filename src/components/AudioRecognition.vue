<script>
import axios from 'axios';
import Recorder, { ENCODE_TYPE } from 'recorderx'; // 使用了RecorderX

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

export default class AudioRecognition {
    constructor(callback) {

        this.recorder = new Recorder({
            sampleRate: 48000, // 采样率
            bitRate: 128000, // 比特率
            channels: 1, // 声道数
            encodeType: ENCODE_TYPE.WAV, // 编码类型
        });

        this.url = 'http://127.0.0.1:8081/upload'; // 本地运行Python Whisper服务的url

        this.volume = 0;

        this.stream = null;
        this.audioContext = null;
        this.sourceNode = null;
        this.analyser = null;

        this.volumeThreshold = 30; // 开始捕捉声音的音量下限
        this.breakSpan = 1000; // 结束声音捕捉需要等待的时间(单位: ms)
        this.clearSpan = 3000; // 连续这么长时间没有检测到声音的话，就清空recorder的记录，以免向语音识别后端发送过多空白语音(单位: ms)
        this.prevSoundTime = null; // 上次认定声音超过阈值的时间戳
        this.soundEndTime = null; // 上一段声音结束的时间戳

        this.soundDetected = false; // 是否监测到声音
        this.chunks = []; // 存储已经捕捉的声音
        this.callback = callback; // callback将在每次语音识别后执行

        this.isRecording = false;
    }

    async launch() {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
        this.sourceNode.connect(this.analyser);

        this.soundDetected = false;

        this.recorder.start(this.stream);
        this.isRecording = false;
        this.mainLoop();
    }

    async pause() {
        this.recorder.pause();
        
        if (this.isRecording) {
            let text = await this.recognize();
            if (text !== "") {
                this.callback(text);
            }
            this.soundDetected = false;
        }

        this.recorder.clear();
        this.isRecording = false;
        this.soundDetected = false;
    }

    resume() {
        this.recorder.clear();
        this.recorder.start(this.stream);
        this.soundEndTime = null;
        this.isRecording = true;
    }
    
    async mainLoop(){
        if (!this.isRecording) {
            this.volume = 0;
            setTimeout(async() => {await this.mainLoop()}, 100);
            return;
        }

        this.volume = this.getVolume();

        if (this.volume > this.volumeThreshold) {
            this.prevSoundTime = Date.now();

            if (!this.soundDetected) {
                // 开始监测到声音
                console.log('[AudioRecognition] Sound detected.');
                this.soundDetected = true;
            }
        }

        if (this.prevSoundTime && Date.now() - this.prevSoundTime > this.breakSpan && this.soundDetected) {
            // 声音结束
            console.log('[AudioRecognition] Sound ended.');
            this.recorder.pause();
            this.soundDetected = false;
            let text = await this.recognize();

            this.recorder.clear();
            this.recorder.start(this.stream); // 识别后立即重新开始录音，以免语音开头录不上
            this.soundEndTime = Date.now();

            this.callback(text); // 回调函数
        }

        if (this.soundEndTime && !this.soundDetected && Date.now() - this.soundEndTime > this.clearSpan) {
            // 如果超过一定时间没有检测到声音，那就清空recorder，以免向语音识别后端传输过多空白音频
            this.recorder.pause();
            this.recorder.clear();
            this.recorder.start(this.stream);
            this.soundEndTime = null;
        }

        setTimeout(async() => {await this.mainLoop()}, 100);
    }

    async recognize() {

        let blob = this.recorder.getRecord({encodeTo: ENCODE_TYPE.WAV}); // wav格式的二进制对象
 
        let response;
        let text = "";
        try {
            response = await axios.post(this.url, {
                base64Data: await fileToBase64(blob)
            })
            text = response.data.transcription;
        } catch(e) {
            console.warn(e);
            text = "";
        }

        console.log('[AudioRecognition] Recognition result:', text);

        return text;
    }

    getVolume() {
        // AudioBank.vue中也有这段代码
        let analyser = this.analyser;
        let frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);
        let sum = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            sum += frequencyData[i];
        }
        let average = sum / frequencyData.length;
        // console.log("Current volume: " + average);
        return average;
    }
}

</script>