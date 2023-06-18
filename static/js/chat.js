$.fn.chatBubble = function () {};

$(document).ready(function () {
    $(".chatinput").submitableForm(function (data) {
        console.log("message sent..");
        renderSingleChat(data.markup, true);
        $(".chatwriter").focus();
    });

    $(".chatinput").on("keypress", function (e) {
        if (e.keyCode != 13) {
            return;
        }
        if (e.shiftKey == true) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();

        if ($(".chatwriter").val().trim() == "") {
            return;
        }
        $(".chatinput").submit();
        return false;
    });

    setInterval(poller, 2000);
    poller();
    $(".chatwriter").focus();

    setInterval(function () {
        $(".bubblechat").each(function () {
            var epoch = $(this).find(".ts").attr("x-epoch");
            var dateString = moment.unix(epoch).tz("Asia/Kolkata").fromNow();
            $(this).find(".ts").html(dateString);
        });
    }, 1000);
});

var firstPoll = true;

var poller = function () {
    var lastChatId = "0";
    if (!!$(".bubblechat:last").attr("x-chatid")) {
        lastChatId = $(".bubblechat:last").attr("x-chatid");
    }
    $.get("./fetch/?from=" + lastChatId + "&_=" + new Date(), function (res) {
        var data = res["chats"];
        var nicks = res["nicks"];
        $(".alivenicks").html(nicks.join(" <> "));

        for (var i = 0; i < data.length; i++) {
            renderSingleChat(data[i]);
        }
        var newLastChatId = $(".bubblechat:last").attr("x-chatid");
        if (data.length > 0 && lastChatId != newLastChatId) {
            popSound(firstPoll);
        }
        if (firstPoll) {
            firstPoll = false;
            $(".chatcontainer").append(
                "<p class='text-center my-4 py-2 text-yellow-50 text-xs'><i class='fa fa-lock'></i> Messages are end-to-end encrypted. No one outside of this chat, not even the application can read the messages. Encrypted messages are also purged after 15 mins.</p>"
            );
        }
    });
};
var renderSingleChat = function (markup, viaSelf) {
    if (typeof viaSelf == "undefined") {
        viaSelf = false;
    }
    console.log("Rendering.. ownmessage?", viaSelf);

    $(".chatcontainer").append(markup);
    var lastEntry = $(".bubblechat:last");
    var epoch = lastEntry.find(".ts").attr("x-epoch");
    var ts = moment.unix(epoch).tz("Asia/Kolkata").format("DD-MM-YYYY hh:ss A");
    var dateString = moment.unix(epoch).tz("Asia/Kolkata").fromNow();
    lastEntry.find(".ts").html(dateString).attr("title", ts);
    var crypto = new SimpleCrypto(room_id);
    var decrypted = crypto.decrypt(lastEntry.find("script").html());
    lastEntry.find(".decrypted").html(decrypted);

    var scroll = $(".chatcontainer");
    setTimeout(function () {
        scroll.scrollTop(scroll.prop("scrollHeight"));
    }, 100);
};
