function getFormData($form) {
    var unindexed_array = $form.serializeArray();
    var indexed_array = {};

    $.map(unindexed_array, function (n, i) {
        indexed_array[n["name"]] = n["value"];
    });

    return indexed_array;
}

var xhr = function (url, body, successFn, errorFn) {
    console.log("URL", url, "Body", body);
    successFn = successFn || function () {};
    errorFn = errorFn || function () {};
    var method = "POST";
    console.log("Submitting", body);
    var crypto = new SimpleCrypto(room_id);

    var encrypted = crypto.encrypt(body["msg"]);
    body["msg"] = encrypted;
    /* Only encrypted message reaches the server */

    $.ajax({
        url: url,
        context: this,
        data: JSON.stringify(body),
        contentType: "application/json",
        dataType: "json",
        method: method,
        success: function (data) {
            successFn.call(this, data);
        },
        error: function (err) {
            errorFn.call(this, err);
        },
    });
    return false;
};

$.fn.autoA = function (successFn, errorFn) {
    $(this).click(function (e) {
        e.stopPropagation();
        e.preventDefault();

        successFn = successFn || function () {};
        errorFn = errorFn || function () {};

        var href = $(this).attr("href");
        xhr.call(this, href, {}, successFn, errorFn);

        return false;
    });
};

$.fn.submitableForm = function (successFn) {
    $(this).submit(function (e) {
        e.preventDefault();
        e.stopPropagation();
        var data = getFormData($(this));
        var action = $(this).attr("action");

        var that = this;
        $(this).find("textarea").val("");
        xhr.call(that, action, data, successFn, function () {
            alert("Error saving!");
        });

        return false;
    });
};

$.fn.xhrForm = function (successFn) {
    $(this)
        .find("input,textarea,select")
        .blur(function () {
            var name = $(this).attr("name");
            if (name == "reviewer") {
                return false;
            }
            var value = $(this).val();
            var action = $(this).parents("form").attr("action");
            var data = {};
            data[name] = value;
            var that = this;
            setTimeout(function () {
                xhr.call(that, action, data, successFn, function () {
                    alert("Error saving value!");
                });
            }, 200);
        });
};
