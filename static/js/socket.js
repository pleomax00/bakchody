var socket = io();

var MessageProcessor = function () {
    this.on_incoming = function (data) {
        console.log("Incoming..", data);
        if (data.from == nick) {
            return;
        }
        poller();
    };
    this.on_join = function (data) {
        console.log("Join..", data);
        poller();
    };

    this.on_disconnect = function (data) {
        console.log("Someone disconnected, refreshing..");
        setTimeout(poller, 5000);
    };

    this.on_markread = function (data) {
        console.log("Marking read:", data);
        doMarkRead(data["ids"]);
    };

    this.on_markopen = function (data) {
        var bubble = $("[x-chatid=" + data.id + "]");
        if (bubble.attr("x-from") != nick) {
            return; // our own chat
        }
        console.log("Marking open:", data);
        bubble.find(".tripletick").addClass("text-yellow-500");
    };
};
var processor = new MessageProcessor();

$(document).ready(function () {
    socket.on("connect", function () {
        console.log("Connected!");
        socket.emit("join", { room_id: room_id });
    });

    socket.on("message", function (data) {
        if (processor.hasOwnProperty("on_" + data.action)) {
            var fn = processor["on_" + data.action];
            fn.call(processor, data);
        } else {
            console.error("No such processor: " + data.action);
        }
    });

    setInterval(function () {
        socket.emit("alive", { room_id: room_id });
    }, 2000);
});
