var canPlay = false;
var audioElement = null;

$(document).ready(function () {
    audioElement = document.createElement("audio");
    audioElement.setAttribute("src", "/static/audio/pop.mp3");

    audioElement.addEventListener("canplay", function () {
        canPlay = true;
    });

    Notification.requestPermission().then(function (permission) {
        console.log(permission);
    });
});

var popSound = function (firstPoll) {
    if (settings["s_notification"] == "off") {
        return;
    }
    if (firstPoll == true) {
        return;
    }

    if (document.hasFocus()) {
        if (canPlay) {
            console.log("Pop!");
            audioElement.play();
        } else {
            console.warn("Cannot play audio!");
        }
    } else {
        var icon = "https://bakchody.app/static/images/favicon.png";
        var notification = new Notification("New B@#$!", {
            body: "...",
            icon: icon,
        });
    }
};
