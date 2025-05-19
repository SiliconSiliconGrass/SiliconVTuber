<template>
  <div class="move-box" id="move-box"></div>
  <Demo ref="Demo"/>
</template>

<script>
// import Demo from './components/LatexDictation.vue';
// import Demo from './Demo/MisakaMinecraft.vue';

// import Demo from './Demo/MisakaDemo.vue';

// import Demo from './Demo/TempTest.vue'
import Demo from './Demo/DoubleCharacterTest.vue'

export default {
  components: {
    Demo
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
      this.$refs.Demo.l2dResourcesPath = 'http://127.0.0.1:8080/Resources/';
      this.$refs.Demo.l2dModelDirPath = 'http://127.0.0.1:8080/Resources/model_dir.txt';
    } else {
      this.$refs.Demo.l2dResourcesPath = '/Resources/';
      this.$refs.Demo.l2dModelDirPath = '/Resources/model_dir.txt';
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
