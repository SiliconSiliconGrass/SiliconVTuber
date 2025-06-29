<script>
/* eslint-disable */
export default class AbstractTtsHelper {
    setup() {
        throw new Error("Abstract method 'setup' must be implemented by subclass");
    }
    
    async generateAudio(text) {
        throw new Error("Abstract method 'generateAudio' must be implemented by subclass");
    }
}
</script>