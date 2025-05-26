setInterval(() => {
    const danmukuElements = document.getElementsByClassName("danmaku-item");

    function handleNewDanmaku(e) {
        const username = e.getAttribute('data-uname');
        const content = e.getAttribute('data-danmaku');

        fetch('http://localhost:5252/newMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: {
                    content: content,
                    username: username,
                    type: 'danmuku'
                }
            })
        })
    }

    for (let e of danmukuElements) {
        if (!e.handled) {
            handleNewDanmaku(e);
            e.handled = true;
        }
    }
}, 100);