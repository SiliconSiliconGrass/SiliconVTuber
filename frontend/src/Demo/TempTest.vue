<template>
    <div>
        <!-- Temp Test -->
         <button @click="enableAudioActivities" style="position: fixed; z-index: 999;">启用音频</button>
        <canvas ref="testCanvas1" width="500" height="800" style="position: absolute; left: 0;"></canvas>
        <canvas ref="testCanvas2" width="500" height="800" style="position: absolute; right: 0;"></canvas>
        <div id="user-interface"></div>
    </div>
</template>

<script>

import XmlStreamParser from '@/SiliconVTuberCore/StreamEventSystem/XmlStreamParser.js';
import AbstractEventStreamParser from '@/SiliconVTuberCore/StreamEventSystem/AbstractEventStreamParser.js';

class a extends AbstractEventStreamParser {
    constructor(params) {
        super(params);
        console.log("defined a: ", params);
    }
    parseDeltaMessageOfEvent(deltaMessage){
        console.log("a: ", deltaMessage);
    }
}

class b extends AbstractEventStreamParser {
    constructor(params) {
        super(params);
        console.log("defined b: ", params);
    }
    parseDeltaMessageOfEvent(deltaMessage){
        console.log("b: ", deltaMessage);
    }
}

export default {

    mounted() {
        const xmlStreamParser = new XmlStreamParser({"acfun": a, "bilibili": b});
        xmlStreamParser.onReceiveDelta("<");
        xmlStreamParser.onReceiveDelta("ac");
        xmlStreamParser.onReceiveDelta("fun");
        xmlStreamParser.onReceiveDelta(">");
        xmlStreamParser.onReceiveDelta("ha");
        xmlStreamParser.onReceiveDelta("ahha");
        xmlStreamParser.onReceiveDelta("ahhahda");
        xmlStreamParser.onReceiveDelta("8oiajfiasf");
        xmlStreamParser.onReceiveDelta("<");
        xmlStreamParser.onReceiveDelta("/");
        xmlStreamParser.onReceiveDelta("acfun>");
        xmlStreamParser.onReceiveDelta("<");
        xmlStreamParser.onReceiveDelta("bilibili x=\"1\" y=\"2\"></bilibili><bilibili>ahahsdhahsdhasdhasd</bilibili><bilibili>12123123</bilibili><acfun qawdasd=\"asdasdasd\">12310928389021382139012390<aasdasd></acfun>");


    }
};
</script>

<style>
#app {
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}

.user-interface {
    z-index: 999;
    position: fixed;
    width: 90vw; /* 1vw = 视口宽的的1% */
    max-width: 600px;
    left: 50vw;
    top: 100vh;
    transform: translate(-50%, -150%);
    /* border: 1px solid black; */
    /* background-color: yellow; */
    /* -webkit-app-region: drag; */
}

.user-interface > * {
    border-radius: 10px;
    margin: 10px;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    font-size: 2em;
}
.user-interface > input {
    width: 80%;
    max-width: 800px;
}

.subtitle-area {
    position: absolute;
    z-index: 998;
    margin: 0;
    padding: 0;
    width: 95vw;
    left: 50vw;
    bottom: 30vh;
    transform: translate(-50%, 0);
}

.subtitle {
    font-size: 3em;
    font-weight: 1000;
    -webkit-text-stroke: 1px white;
    text-shadow: 5px 5px rgb(43, 38, 43);
    user-select: none;
    color: #d459b9;
}

.visualize-area {
    position: absolute;
    z-index: 2;
    right: 5%;
    width: 20vw;
}

.action-queue {
    position: relative;
    width: 100%;
}

.action-container {
    position: relative;
    margin: 5px;
    width: 100%;
    border: 1px solid black;
    background: rgb(116, 116, 238);
    border-radius: 10px;
    color: white;
}

.resource-bank {
    position: relative;
    width: 100%;
}

.resource-container {
    position: relative;
    margin: 5px;
    width: 100%;
    border: 1px solid black;
    background: rgb(238, 116, 179);
    border-radius: 10px;
    color: white;
}

</style>