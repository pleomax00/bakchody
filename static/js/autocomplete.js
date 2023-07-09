var wasOn = false;
var tempString = "";
var lastACSelected = "";

$(document).ready(function () {
    $("body").append("<ul class='acomplete hidden fixed'></ul>");
});

var arrowMovement = function (e) {
    if (e.keyCode == 38 || e.keyCode == 40) {
        e.preventDefault();
        e.stopPropagation();
        if (e.keyCode == 40) {
            var next = $(".acomplete > li.sel").next();
            if (next.length) {
                $(".acomplete > li.sel").removeClass("sel");
                $(next).addClass("sel");
                lastACSelected = $(next).attr("x-val");
            }
        } else if (e.keyCode == 38) {
            var prev = $(".acomplete > li.sel").prev();
            if (prev.length) {
                $(".acomplete > li.sel").removeClass("sel");
                $(prev).addClass("sel");
                lastACSelected = $(prev).attr("x-val");
            }
        }
        return false;
    }
};

var lastAcText = "";
var autocomplete = function (e, keyCode) {
    //console.log("ac", keyCode);
    if (keyCode == 13) {
        lastAcText = "";
        return;
    }
    var carentPos = $(".chatwriter").prop("selectionStart");
    var textAreaText = $(".chatwriter").val();
    if (textAreaText == lastAcText) {
        return;
    }
    lastAcText = textAreaText;

    for (var i = carentPos - 1; i >= 0; i--) {
        var code = textAreaText.charCodeAt(i);
        if (
            !(
                (code > 47 && code < 58) ||
                (code > 64 && code < 91) ||
                (code > 96 && code < 123)
            )
        ) {
            tempString = textAreaText.substr(i, carentPos);
            break;
        }
    }
    console.log(tempString);
    if (!tempString.startsWith(":")) {
        $(".acomplete").addClass("hidden");
        lastACSelected = "";
        return;
    }
    tempString = tempString.substring(1, tempString.length);

    $(".acomplete").html("");
    if (tempString == "") {
        $(".acomplete").addClass("hidden");
        lastACSelected = "";
        return;
    } else {
        $(".acomplete").removeClass("hidden");
    }

    for (shortcode in emojiData) {
        if (shortcode.startsWith(tempString)) {
            //console.log(shortcode);
            $(".acomplete").append(
                "<li x-val=':" +
                    shortcode +
                    ":'>" +
                    emojiData[shortcode] +
                    " :" +
                    shortcode +
                    ":</li>"
            );
        }
    }
    $(".acomplete > li:first").addClass("sel");
    lastACSelected = $(".acomplete > li:first").attr("x-val");
};
