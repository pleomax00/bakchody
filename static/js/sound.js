var canPlay = false;
var audioElement = null;

$(document).ready(function () {
    audioElement = document.createElement("audio");
    audioElement.setAttribute("src", "/static/audio/pop.mp3");

    audioElement.addEventListener("canplay", function () {
        canPlay = true;
    });
});

var popSound = function () {
    if (canPlay) {
        console.log("Pop!");
        audioElement.play();
    } else {
        console.warn("Cannot play audio!");
    }
};
