<script>
/* eslint-disable */
export default class AbstractTtsHelper {
    setup() {
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }
    
    async generateAudio(text) {
        text = String;
        throw "Abstract Method Not Overrided! (You need to override this method! )";
    }
}
</script>