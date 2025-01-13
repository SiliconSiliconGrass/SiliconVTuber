<template>
    <div v-if="urls">
        <div v-for="(url, index) in urls" :key="index">
            <audio :id="`audioPlayer${index}`">
                <source :src="url" type="audio/mpeg">
                您的浏览器不支持 audio 元素。
            </audio>
        </div>
    </div>
</template>

<script>

function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export default {
    // props: {
    //     urls: {
    //         type: Array
    //     }
    // },

    data() {
        return {
            urls: [],
            // itemRefs: [],
        }
    },

    methods: {

        getAudioElement(index) {
            console.log('get audio element:', `audioPlayer${index}`);
            return document.getElementById(`audioPlayer${index}`);
        },

        add(url) {
            this.urls.push(url);
            this.$nextTick(() => {
                var index = this.urls.indexOf(url);
                var audioEle = this.getAudioElement(index);
                audioEle.load();
            });
        },

        remove(url) {
            var index = this.urls.indexOf(url);
            if (index === -1) return;
            this.urls.splice(index, 1);
        },

        clearAudios() {
            this.urls = [];
        },

        async play(url, callback) { // 播放音频并等待播放结束
            return new Promise((resolve, reject) => {
                var index = this.urls.indexOf(url);
                if (index === -1) {
                    reject('Audio not exist or not ready!');
                    return;
                }

                var audioEle = this.getAudioElement(index);
                audioEle.load();
                audioEle.play();
                audioEle.addEventListener('ended', async () => {
                    if (callback) {
                        await delay(50);
                        callback(this, url);
                    }
                    resolve();
                }, { once: true });
            });
        },

        // setRef(el) {
        //     if (el) {
        //         this.itemRefs.push(el);
        //     }
        // }
    },

    // beforeUpdate() {
    //     this.itemRefs = [];
    // }
}
</script>