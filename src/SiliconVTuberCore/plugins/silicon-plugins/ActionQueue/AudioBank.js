/* eslint-disable */
function nextTick(callback) {
  return Promise.resolve().then(callback);
}

/**
 * Audio loading, playing, and real time volume calculating.
 */
export default class AudioBank {
    constructor() {

        /** @type {Array<string>} */
        this.urls = [];

        /** @type {string} */
        this.currAudioUrl = null;

        /** @type {number} */
        this.volume = 0;

        /** @type {AudioContext} */
        this.audioContext = new AudioContext();
        
        /** @type {AnalyserNode} */
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.connect(this.audioContext.destination);

        /** @type {HTMLDivElement} */
        this.audioContainer = document.createElement('div');
        document.body.appendChild(this.audioContainer);

        // TODO: try requestAnimationFrame
        setInterval(() => {
            this.volume = (this.getVolume() - 55) / 30;
        }, 10);
    }

    handleUserGesture() {
        // 确保浏览器支持 suspend 和 resume
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('AudioContext available!');
            });
        }
    }

    getAudioElement(index) {
        return this.audioContainer.querySelector(`#audioPlayer${index}`);
    }

    add(url) {
        this.urls.push(url);

        let audio = document.createElement('audio');
        audio.setAttribute("id", `audioPlayer${this.urls.length - 1}`);
        audio.setAttribute("src", url);
        audio.setAttribute("crossOrigin", "anonymous");
        // audio.setAttribute("controls", ""); // [debug]
        this.audioContainer.appendChild(audio);

        const self = this;
        nextTick(() => {
            let index = self.urls.indexOf(url);
            let audio = self.getAudioElement(index);

            try {
                audio.load();
            } catch(e) {
                console.warn(e);
            }
            nextTick(() => {
            // let context = this.audioContext; // audio context
                let sourceNode = self.audioContext.createMediaElementSource(audio);
                sourceNode.connect(self.analyser); // 连接sourceNode到analyser
            });
            
        });
    }

    remove(url) {
        var index = this.urls.indexOf(url);
        if (index === -1) return;
        this.urls.splice(index, 1);
    }

    clearAudios() {
        this.urls = [];

        Array.from(this.audioContainer.children).forEach(child => {
            if (child.tagName === 'AUDIO') {
                const audioSrc = child.src;
                if (audioSrc.startsWith('blob:')) {
                    URL.revokeObjectURL(audioSrc); // 释放内存
                }
                child.remove();
            }
        });

        this.audioContainer.innerHTML = "";
    }

    async play(url, callback) { // 播放音频并等待播放结束
        return new Promise((resolve, reject) => {
            let index = this.urls.indexOf(url);
            if (index === -1) {
                reject(`Audio not exist or not ready! (url: ${url})`);
                return;
            }

            this.currAudioUrl = url;

            let audio = this.getAudioElement(index);

            try {
                audio.load();
                audio.play();
            } catch(e) {
                console.warn(e);
            }
            audio.addEventListener('ended', async () => {
                if (callback) {
                    callback(this, url);
                }
                this.currAudioUrl = null;
                resolve();
            }, { once: true }); // 该listener只触发一次
        });
    }

    getVolume() {

        // 先判断url指向的audio是否可用
        let url = this.currAudioUrl;
        if (!url) return 0;
        let index = this.urls.indexOf(url);
        if (index === -1) {
            return 0;
        }

        let analyser = this.analyser;

        // 创建一个数组来存储频率数据
        let frequencyData = new Uint8Array(analyser.frequencyBinCount);

        // 获取当前频率数据
        analyser.getByteFrequencyData(frequencyData);
        
        // 计算音量大小（这里使用所有频率的平均值作为音量大小的一个近似）
        let sum = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            sum += frequencyData[i];
        }
        let average = sum / frequencyData.length;
        
        // 输出音量大小
        // console.log("Current volume: " + average);
        return average;
    }
}
