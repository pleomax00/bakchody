$.fn.chatBubble = function () {};
var firstPoll = true;
var colounEmojiRe = /:[a-z_]+:/g;

var poller = function () {
    var lastChatId = "0";
    if (!!$(".bubblechat:last").attr("x-chatid")) {
        lastChatId = $(".bubblechat:last").attr("x-chatid");
    }
    $.get("./fetch/?from=" + lastChatId + "&_=" + new Date(), function (res) {
        var data = res["chats"];
        var nicks = res["nicks"];
        if (nicks.length > 0) {
            $(".alivenicks").html(
                "<i class='fa-regular fa-comments'></i> " + nicks.join(" <> ")
            );
        }

        var otherChatCount = 0;
        for (var i = 0; i < data.length; i++) {
            var markup = data[i][0];
            var rawChat = data[i][1];
            var chatId = rawChat["id"];
            if ($("[x-chatid=" + chatId + "]").length) {
                console.warn("Already in the DOM!");
                continue;
            }

            renderSingleChat(markup);
            if (rawChat["from"] != nick) {
                console.log(rawChat["from"], nick);
                otherChatCount++;
            }
        }
        var newLastChatId = $(".bubblechat:last").attr("x-chatid");
        if (firstPoll) {
            firstPoll = false;
            $(".chatcontainer").append(
                "<p class='text-center my-4 py-2 text-yellow-50 text-xs'><i class='fa fa-lock'></i> Messages are end-to-end encrypted. No one outside of this chat, not even the application can read the messages. Encrypted messages are also purged 30 mins after being read.</p>"
            );
            onWindowFocus.call(window);
        } else {
            if (otherChatCount > 0) {
                popSound();
            }
        }
        $(".typingindicator").html("");
    });
};

var onWindowFocus = function () {
    console.log("Focused!");
    $(".bubblechat").each(function () {
        if ($(this).attr("x-from") == nick) {
            return;
        }
        if ($(this).hasClass("markopened")) {
            return;
        }
        var messageId = $(this).attr("x-chatid");
        console.log("Sending open reciept for:", messageId);
        socket.emit("markopen", { room_id: room_id, id: messageId });
        $(this).addClass("markopened");
    });
};

const regex =
    /^[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]{1,5}$/u;

var renderSingleChat = function (markup, viaSelf) {
    if (typeof viaSelf == "undefined") {
        viaSelf = false;
    }
    //console.log("Rendering.. ownmessage?", viaSelf, markup);

    $(".chatcontainer").append(markup);
    var lastEntry = $(".bubblechat:last");
    var epoch = lastEntry.find(".ts").attr("x-epoch");
    var ts = moment.unix(epoch).tz("Asia/Kolkata").format("DD-MM-YYYY hh:ss A");
    var dateString = moment.unix(epoch).tz("Asia/Kolkata").fromNow();
    lastEntry.find(".ts").html(dateString).attr("title", ts);
    var crypto = new SimpleCrypto(room_id);

    var cipheredMsg = lastEntry.find("script").html();
    var decrypted = "";
    if (cipheredMsg != "__image__") {
        decrypted = crypto.decrypt(cipheredMsg);
        var matches = decrypted.match(colounEmojiRe);
        if (matches != null) {
            for (var i = 0; i < matches.length; i++) {
                var emoji = matches[i].substr(1, matches[i].length - 2);
                console.log(
                    "Replacing",
                    matches[i],
                    emoji,
                    emojiData[emoji.trim()]
                );
                decrypted = decrypted.replace(matches[i], emojiData[emoji]);
            }
        }
        lastEntry.find(".decrypted").html(decrypted);
    }

    var rawMsg = lastEntry.find(".decrypted").html();
    if (rawMsg.trim().match(regex)) {
        /* Its an empty emoji */
        lastEntry.find(".decrypted").addClass("text-4xl");
    }

    var scroll = $(".chatcontainer");
    setTimeout(function () {
        scroll.scrollTop(scroll.prop("scrollHeight"));
    }, 100);

    if (document.hasFocus()) {
        onWindowFocus.call(window);
    }
};

var typingTTL = 2;
var lastTyped = null;

$(document).ready(function () {
    $(".chatinput").submitableForm(function (data) {
        console.log("message sent..");
        renderSingleChat(data.markup, true);
        $(".chatwriter").focus();
    });

    $(".chatinput").on("keyup", function (e) {
        return autocomplete(e, e.keyCode);
    });

    $(".chatinput").on("keydown", function (e) {
        return arrowMovement(e);
    });

    $(".chatinput").on("keypress", function (e) {
        if (e.keyCode != 13) {
            /* Not enter Key */
            var now = new Date().getTime() / 1000;
            if (lastTyped == null || now - lastTyped > typingTTL) {
                lastTyped = now;
                socket.emit("typing", { room_id: room_id });
            }
            return;
        }
        if (e.shiftKey == true) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();

        var chatMsg = $(".chatwriter").val().trim();
        if (chatMsg == "") {
            return;
        }

        console.log("AC has", lastACSelected);
        if (lastACSelected == "" || typeof lastACSelected == "undefined") {
            $(".chatinput").submit();
        } else {
            var carentPos = $(".chatwriter").prop("selectionStart");
            var textAreaText = $(".chatwriter").val();
            for (var i = carentPos - 1; i >= 0; i--) {
                var code = textAreaText.charCodeAt(i);
                if (
                    !(
                        (code > 47 && code < 58) ||
                        (code > 64 && code < 91) ||
                        (code > 96 && code < 123)
                    )
                ) {
                    console.log("replaceing", i, carentPos);
                    var newTextAreaText =
                        textAreaText.substr(0, i) +
                        lastACSelected +
                        " " +
                        textAreaText.substr(carentPos, textAreaText.length);
                    console.log(newTextAreaText);
                    $(".chatwriter").val(newTextAreaText);
                    $(".acomplete").addClass("hidden");
                    lastACSelected = "";
                    break;
                }
            }
        }
        return false;
    });

    poller();
    $(".chatwriter").focus();

    setInterval(function () {
        $(".bubblechat").each(function () {
            var epoch = $(this).find(".ts").attr("x-epoch");
            var dateString = moment.unix(epoch).tz("Asia/Kolkata").fromNow();
            $(this).find(".ts").html(dateString);
        });
    }, 1000);

    $(window).focus(onWindowFocus);

    $(".stoggle").click(function () {
        var name = $(this).attr("x-name");
        var currentValue = $(this).attr("x-value");
        var newValue;
        if (currentValue == "on") {
            newValue = "off";
        } else {
            newValue = "on";
        }
        var oldClasses = $(this).attr("x-" + currentValue);
        var newClasses = $(this).attr("x-" + newValue);
        $(this).find("i").removeClass(oldClasses).addClass(newClasses);
        $(this).attr("x-value", newValue);
        settings[name] = newValue;
        $.post("/set/" + name + "/" + newValue + "/");
    });
});

var doMarkRead = function (ids) {
    for (var i = 0; i < ids.length; i++) {
        var readId = ids[i];
        $("i[x-read-id=" + readId + "]")
            .removeClass("fa-check")
            .addClass("fa-check-double");
    }
};
