<template>
  <div class="move-box" id="move-box"></div>
  <MaoDemo ref="MaoDemo"/>
</template>

<script>
// import CozeBot from './components/CozeBot.vue'
import MaoDemo from './components/MaoDemo.vue';

export default {
  components: {
    MaoDemo
  },

  data() {
    return {
      // when using electron, useElectron should be true;
      // when using normal browsers, useElectron shuold be false
      useElectron: false,
    }
  },

  mounted() {
    if (this.useElectron) {
      this.$refs.MaoDemo.l2dResourcesPath = 'http://127.0.0.1:8080/Resources/';
      this.$refs.MaoDemo.l2dModelDirPath = 'http://127.0.0.1:8080/Resources/model_dir.txt';
    } else {
      this.$refs.MaoDemo.l2dResourcesPath = '/Resources/';
      this.$refs.MaoDemo.l2dModelDirPath = '/Resources/model_dir.txt';
    }
  }
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
