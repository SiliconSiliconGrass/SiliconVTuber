// This script works only in electron

function setIgnoreMouseEvents(arg1, arg2) {
    // if (!window.electronAPI) return;
    window.electronAPI.setIgnoreMouseEvents(arg1, arg2);
}

function dragWindow(mouseX, mouseY, startX, startY) {
    // if (!window.electronAPI) return;
    window.electronAPI.dragWindow(mouseX - startX, mouseY - startY);
}

window.onload = () => {

    window.dragging = false;

    setTimeout(() => {
        let ui = document.getElementById('user-interface');
        ui.onmouseleave = () => {
            setIgnoreMouseEvents(true, { forward: true })
        };
        ui.onmouseenter = () => {
            setIgnoreMouseEvents(false)
        };

        let mb = document.getElementById('move-box');
        mb.onmouseleave = () => {
            setIgnoreMouseEvents(true, { forward: true })
        };
        mb.onmouseenter = () => {
            setIgnoreMouseEvents(false)
        };
    }, 100);

    setTimeout(() => {
        let canvas = document.getElementsByTagName('canvas')[0];
        canvas.setAttribute('style', 'width: 80vw; height: 100vh; left: 10vw');
    }, 100);

    document.addEventListener('mousemove',  (event) => {
        if (!window.dragging) return;
        let mouseX = event.pageX;
        let mouseY = event.pageY;
        dragWindow(mouseX, mouseY, window.dragStartX, window.dragStartY);
    });

    document.addEventListener('mousedown',  (event) => {
        window.dragStartX = event.pageX;
        window.dragStartY = event.pageY;
        window.dragging = true;
    });

    document.addEventListener('mouseup',  (event) => {
        window.dragging = false;
    });
}