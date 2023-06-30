var supportedImageTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/heic",
];

var uploadFile = function (files) {
    var f = files[0];
    $(".spinner").removeClass("hidden");
    console.log(f.type);
    if (supportedImageTypes.indexOf(f.type) == -1) {
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
            $(".spinner").addClass("hidden");
        },
        error: function (data) {
            $(".spinner").addClass("hidden");
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

    $("#fileinput").change(function (e) {
        var fd = new FormData();
        var files = $(this)[0].files;
        uploadFile(files);
    });

    $(".uploadbtn").click(function () {
        $("#fileinput").trigger("click");
    });
});
