<template>
    <div ref="audioContainer"></div>
    <!-- <div> {{ urls.indexOf(currAudioUrl) }} <br> {{ currAudioUrl }} </div>
    <div>输出音量： {{ volume }}</div> -->
</template>

<script>

// function delay(ms) {
//     return new Promise(resolve => {
//         setTimeout(resolve, ms);
//     });
// }

/**
 * AudioBank: audio loading, playing, and real time volume calculating
 */
export default {
    data() {
        return {
            urls: [],
            currAudioUrl: null,

            audioContext: null,
            analyser: null, // analyserNode

            volume: 0
        }
    },

    methods: {

        handleUserGesture() {
            // 确保浏览器支持 suspend 和 resume
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('AudioContext available!');
                });
            }
        },

        getAudioElement(index) {
            return document.getElementById(`audioPlayer${index}`);
        },

        add(url) {
            this.urls.push(url);

            let audio = document.createElement('audio');
            audio.setAttribute("id", `audioPlayer${this.urls.length - 1}`);
            audio.setAttribute("src", url);
            audio.setAttribute("crossOrigin", "anonymous");
            // audio.setAttribute("controls", ""); // [debug]
            this.$refs.audioContainer.appendChild(audio);

            this.$nextTick(() => {
                let index = this.urls.indexOf(url);
                let audio = this.getAudioElement(index);
                audio.load();
                this.$nextTick(() => {
                // let context = this.audioContext; // audio context
                    let sourceNode = this.audioContext.createMediaElementSource(audio);
                    sourceNode.connect(this.analyser); // 连接sourceNode到analyser
                });
                
            });
        },

        remove(url) {
            var index = this.urls.indexOf(url);
            if (index === -1) return;
            this.urls.splice(index, 1);
        },

        clearAudios() {
            this.urls = [];
            this.$refs.audioContainer.innerHTML = "";
        },

        async play(url, callback) { // 播放音频并等待播放结束
            return new Promise((resolve, reject) => {
                let index = this.urls.indexOf(url);
                if (index === -1) {
                    reject(`Audio not exist or not ready! (url: ${url})`);
                    return;
                }

                this.currAudioUrl = url;

                let audio = this.getAudioElement(index);
                audio.load();
                audio.play();
                audio.addEventListener('ended', async () => {
                    if (callback) {
                        callback(this, url);
                    }
                    this.currAudioUrl = null;
                    resolve();
                }, { once: true }); // 该listener只触发一次
            });
        },

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
        },
    },

    mounted() {

        this.audioContext = new AudioContext();
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.connect(this.audioContext.destination);

        setInterval(() => {
            this.volume = (this.getVolume() - 55) / 30;
        }, 10);
    }
}
</script>