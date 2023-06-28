var supportedImageTypes = ["image/png", "image/jpeg"];

var uploadFile = function (files) {
    var f = files[0];
    console.log(f.type);
    if (supportedImageTypes.indexOf(f.type)) {
        alert("Can upload images only for now.");
        return false;
    }
    var formData = new FormData();
    formData.append("file", f);

    $.ajax({
        type: "POST",
        url: "/upload/" + room_id + "/",
        data: formData,
        processData: false,
        contentType: false,
        success: function (data) {
            //do_something(data) ;
            console.log(data);
            poller();
        },
        error: function (data) {
            console.log("Error in uploading!");
        },
    });
};

$(document).ready(function () {
    $(".allchat").on("dragover", function (e) {
        $(this).addClass("border-dashed");
        e.preventDefault();
        e.stopPropagation();
    });
    $(".allchat").on("dragenter", function (e) {
        e.preventDefault();
        e.stopPropagation();
    });
    $(".allchat").on("dragleave", function (e) {
        $(this).removeClass("border-dashed");
        e.stopPropagation();
        e.preventDefault();
    });

    $(".allchat").on("drop", function (e) {
        $(this).removeClass("border-dashed");
        if (
            e.originalEvent.dataTransfer &&
            e.originalEvent.dataTransfer.files.length
        ) {
            e.preventDefault();
            e.stopPropagation();
            console.log("uploading");
            uploadFile(e.originalEvent.dataTransfer.files);
        }
    });
});
