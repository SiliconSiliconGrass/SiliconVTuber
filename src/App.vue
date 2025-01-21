<template>
  <div class="move-box" id="move-box"></div>
  <MaoDemo/>
</template>

<script>
// import CozeBot from './components/CozeBot.vue'
import MaoDemo from './components/MaoDemo.vue';

export default {
  components: {
    MaoDemo
  },
};
</script>

<style>

* {
  margin: 0;
  padding: 0;
}

html {
  background-color: rgba(255, 255, 255, 0);
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* -webkit-app-region: drag; */
}

button {
  /* -webkit-app-region: no-drag; */
  user-select: none;
}

.move-box {
  z-index: 100;
  position: fixed;
  margin: 0;
  padding: 0;
  width: 10vw;
  height: 100vh;
  left: 50vw;
  top: 0;
  /* border: 1px solid black;
  background-color: white; */
  cursor: move;
  transform: translateX(-50%);
}

</style>
