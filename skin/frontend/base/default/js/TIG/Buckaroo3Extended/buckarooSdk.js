/*!
    * Buckaroo Client SDK v1.5.1
    *
    * Copyright Buckaroo
    * Released under the MIT license
    * https://buckaroo.nl
    *
    * Date: 2019-04-23 16:22
 */
var BuckarooSdk;
(function (BuckarooSdk) {
    var $ = jQuery;
    var Base;
    (function (Base) {
        Base.checkoutUrl = "https://checkout.buckaroo.nl";
        Base.websocketUrl = "wss://websockets.buckaroo.io/";
        var initiate = function () {
            // insert css file into html head
            document.head.insertAdjacentHTML("beforeend", "<link href=\"" + Base.checkoutUrl + "/api/buckaroosdk/css\" rel=\"stylesheet\">");
        };
        Base.setupWebSocket = function (url, onMessageEvent) {
            var socket = new WebSocket(url);
            socket.onclose = function (e) {
                setTimeout(function () {
                    Base.setupWebSocket(url, onMessageEvent);
                }, 200);
            };
            socket.onerror = function (err) {
                socket.close();
            };
            socket.onmessage = onMessageEvent;
        };
        initiate();
    })(Base || (Base = {}));
    var Payconiq;
    (function (Payconiq) {
        var progressClasses = "pending waiting scanned success failed";
        var containerSelector;
        var callbackHandler;
        var getCodeUrl = function (transactionKey) {
            var url = Base.checkoutUrl + "/api/payconiq/GetCodeUrl?id=" + transactionKey;
            var getRequest = $.ajax({
                url: url,
                cache: false
            });
            return getRequest;
        };
        var renderQrOrRedirectToApp = function (data) {
            // ios flow
            if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                window.location.href = data.PayconiqIosUrl;
                return;
            }
            // android flow
            if (/Android/i.test(navigator.userAgent)) {
                window.location.href = data.PayconiqAndroidUrl;
                return;
            }
            // other mobile mobile flow
            if (/webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                window.location.href = data.PayconiqUrl;
                return;
            }
            // no QrUrl available? do nothing
            if (!data.QrUrl) {
                return;
            }
            // desktop flow
            $("#qrImage img").attr("src", data.QrUrl);
            $("#qrProgress").removeClass(progressClasses);
            $("#qrProgress").addClass("waiting");
        };
        var setupWebSocketChannel = function (transactionKey) {
            var url = Base.websocketUrl + "Payconiq/" + transactionKey;
            Base.setupWebSocket(url, function (event) {
                // get response object from event
                var responseObj = JSON.parse(event.data);
                // remove any progress classes
                $("#qrProgress").removeClass(progressClasses);
                switch (responseObj.status) {
                    case "PROCESSING":
                        $("#qrProgress").addClass("scanned");
                        callbackHandler(responseObj.status, []);
                        break;
                    case "SUCCESS":
                        $("#qrProgress").addClass("success");
                        if (callbackHandler(responseObj.status, [responseObj.redirectUrl])) {
                            // redirect to URL (after 3 seconds)
                            setTimeout(function () { window.location.href = responseObj.redirectUrl; }, 3000);
                        }
                        break;
                    case "FAILED":
                        $("#qrProgress").addClass("failed");
                        if (callbackHandler(responseObj.status, [responseObj.redirectUrl])) {
                            // redirect to URL (after 3 seconds)
                            setTimeout(function () { window.location.href = responseObj.redirectUrl; }, 3000);
                        }
                        break;
                }
            });
        };
        var renderHtml = function () {
            var html = '<div class="text-align-center">' +
                '       <div id="qrProgress" class="pending">' +
                '          <p>Scan onderstaande code met de <a href="https://www.payconiq.nl/nl/" target="_blank">Payconiq app</a>.</p>' +
                '          <div class="p-4">' +
                '            <div id="qrImage" class="if if-waiting">' +
                '               <img src="" style="opacity: 1;" height="200" width="200" class="img-fluid" />' +
                "            </div>" +
                '            <div id="check" class="if if-pending if-scanned if-success if-failed">' +
                '              <div class="circle-loader">' +
                '                <div class="checkmark draw if if-success"></div>' +
                '                <div class="cross if if-failed"></div>' +
                "              </div>" +
                '              <p class="if if-scanned pt-4 m-0">Rond de betaling af op uw mobiele apparaat...</p>' +
                '              <p class="if if-success pt-4 m-0 text-success">Betaling gelukt! U wordt binnen 5 seconden doorgestuurd...</p>' +
                '              <p class="if if-failed pt-4 m-0 text-failed">Betaling mislukt. U wordt binnen 5 seconden doorgestuurd...</p>' +
                "            </div>" +
                "          </div>" +
                "        </div>" +
                "      </div>";
            $(containerSelector).append(html);
        };
        Payconiq.initiate = function (selector, transactionKey, callback) {
            if (callback === void 0) { callback = null; }
            containerSelector = selector;
            callbackHandler = callback || (function () { return true; });
            // render html
            renderHtml();
            // get qr url
            getCodeUrl(transactionKey).done(renderQrOrRedirectToApp);
            // setup websocket
            setupWebSocketChannel(transactionKey);
        };
    })(Payconiq = BuckarooSdk.Payconiq || (BuckarooSdk.Payconiq = {}));
    var IdealQr;
    (function (IdealQr) {
        var qrLoaded = false;
        var progressClasses = "pending waiting scanned success failed";
        var setupWebSocketChannel;
        var transactionKey;
        var isProcessing;
        var getIdealQrCodeUrl = function () {
            // Setup websocket
            setupWebSocketChannel(transactionKey);
            var def = $.Deferred();
            var url = Base.checkoutUrl + "/api/idealQr/GetCodeUrl?transactionKey=" + transactionKey + "&isProcessing=" + isProcessing;
            var getRequest = $.ajax({
                url: url,
                cache: false
            });
            getRequest.done(function (data) {
                def.resolve(data);
            });
            return def.promise();
        };
        setupWebSocketChannel = function (transactionKey) {
            var url = Base.websocketUrl + "IdealQr/" + transactionKey;
            Base.setupWebSocket(url, function (event) {
                // get response object from event
                var responseObj = JSON.parse(event.data);
                // remove any progress classes
                $("#qrProgress").removeClass(progressClasses);
                switch (responseObj.status) {
                    case "PROCESSING":
                        $("#qrProgress").addClass("scanned");
                        break;
                    case "SUCCESS":
                        $("#qrProgress").addClass("success");
                        setTimeout(function () { window.location.href = responseObj.redirectUrl; }, 5000);
                        break;
                    case "FAILED":
                        $("#qrProgress").addClass("failed");
                        setTimeout(function () { window.location.href = responseObj.redirectUrl; }, 5000);
                        break;
                }
            });
        };
        IdealQr.initiate = function (containerSelector, trxKey, processing) {
            transactionKey = trxKey;
            isProcessing = processing;
            // Inject qr button at #insertQrButton
            var buttonHtml = '<div class="qr-input-group">' +
                '<div class="qr-pink-prepend">' +
                '<span class="qr-pink-prepend-image">' +
                '<img src="data:image/png;base64,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" width="24"></img>' +
                "</span>" +
                "</div>" +
                '<button type="button" id="qrButton" class="qr-pink-button"> Scan QR code </button>' +
                "</div>";
            $(containerSelector).append(buttonHtml);
            // Inject popup html in body
            var bodyHtml = '<div class="qr-popup hidden" id="idealQrPopup" tabindex="-1" role="dialog" aria-hidden="true">' +
                '  <div class="popup-dialog" role="document">' +
                '    <div class="popup-content">' +
                '      <div class="popup-header"> ' +
                '        <h5 class="popup-title" id="examplepopupLabel">Scan de QR code</h5>' +
                "      </div>" +
                '      <div class="popup-body text-align-center">' +
                '       <div id="qrProgress" class="waiting">' +
                "          <p>Scan onderstaande code via uw bank app of de iDEAL QR app.</p>" +
                '          <div class="p-4">' +
                '            <div id="qrImage" class="if if-waiting">' +
                "            </div>" +
                '            <div id="check" class="if if-scanned if-success if-failed">' +
                '              <div class="circle-loader">' +
                '                <div class="checkmark draw if if-success"></div>' +
                '                <div class="cross if if-failed"></div>' +
                "              </div>" +
                '              <p class="if if-scanned pt-4 m-0">Rond de betaling af op uw mobiele apparaat...</p>' +
                '              <p class="if if-success pt-4 m-0 text-success">Betaling gelukt! U wordt binnen 5 seconden doorgestuurd...</p>' +
                '              <p class="if if-failed pt-4 m-0 text-failed">Betaling mislukt. U wordt binnen 5 seconden doorgestuurd...</p>' +
                "            </div>" +
                "          </div>" +
                "        </div>" +
                "      </div>" +
                '      <div class="popup-footer">' +
                '        <button id="close-qr-popup" type="button">Annuleren</button>' +
                "      </div>" +
                "    </div>" +
                "  </div>" +
                "</div>";
            document.body.insertAdjacentHTML("beforeend", bodyHtml);
            $(document).on("click", "#close-qr-popup", function () {
                $(".qr-popup").hide();
            });
            $(document).on("click", "#qrButton", function () {
                if (qrLoaded === false) {
                    // Get logo.
                    var url = getIdealQrCodeUrl();
                    url.done(function (data) {
                        // Fill logo in popup
                        var image = $("<img src=\"" + data.IdealQrUrl + "\" style=\"opacity: 0;\" height=\"400\" width=\"400\" class=\"img-fluid\" />");
                        $("#qrImage").append(image);
                        image.delay(500).fadeTo(200, 1);
                        qrLoaded = true;
                    });
                }
                $(".qr-popup").show();
            });
        };
    })(IdealQr = BuckarooSdk.IdealQr || (BuckarooSdk.IdealQr = {}));
    var BancontactMobile;
    (function (BancontactMobile) {
        var Resources;
        (function (Resources) {
            Resources.bancontactApp = "Bancontact app";
            Resources.cancel = "Cancel";
            Resources.description = 'Scan the code below within 15 minutes with the <a href="{0}" target="_blank">{1}</a>.'; // using ' in stead of ", because this description contains a html tag
            Resources.failed = "Payment failed.";
            Resources.finish = "Finish the payment on your mobile device...";
            Resources.link = "https://www.bancontact.com/en";
            Resources.redirect = "You will be redirected within 5 seconds...";
            Resources.scanCodeText = "Scan the QR code";
            Resources.succeeded = "Payment succeeded!";
            Resources.testSelectInputTypeDescription = "Please select the simulated input type";
            Resources.testSelectStatusDescription = "Please select the simulated status";
            Resources.testStatusSuccessful = "Successful";
            Resources.testStatusFailed = "Failed";
            Resources.testStatusPending = "Pending";
        })(Resources || (Resources = {}));
        var qrLoaded = false;
        var progressClasses = "pending waiting scanned success failed";
        var transactionKey;
        var callbackHandler;
        var getCodeUrl = function (transactionKey) {
            var url = Base.checkoutUrl + "/api/BancontactMobile/GetCodeUrl?transactionKey=" + transactionKey;
            var getRequest = $.ajax({
                url: url,
                cache: false
            });
            return getRequest;
        };
        var sendTestStatusData = function (status, key) {
            var request = $.ajax({
                cache: false,
                type: "GET",
                url: "/api/webhook/transaction/" + key + "?status=" + status,
            });
            request.done(function () {
                $("#statusButtons").remove();
            });
        };
        var sendTestInputTypeData = function (inputType, key) {
            var request = $.ajax({
                cache: false,
                type: "GET",
                url: "/api/webhook/transaction/" + key + "?inputType=" + inputType,
            });
            request.done(function () {
                $("#inputTypeButtons").remove();
                var testButtons = "\n<div id=\"statusButtons\">\n\t<p>" + Resources.testSelectStatusDescription + ":</p>\n\t<div class=\"qr-input-group\">\n\t\t<button type=\"button\" id=\"successfulButton\" class=\"qr-blue-button test-button\">" + Resources.testStatusSuccessful + "</button>\n\t\t<button type=\"button\" id=\"failedButton\" class=\"qr-blue-button test-button\">" + Resources.testStatusFailed + "</button>\n\t</div>\n</div>\n";
                $("#qrTestFlow").append(testButtons);
                $(document).on("click", "#successfulButton", function () {
                    sendTestStatusData("190", key);
                });
                $(document).on("click", "#failedButton", function () {
                    sendTestStatusData("490", key);
                });
            });
        };
        var renderQrOrRedirectToApp = function (data) {
            if (data.IsTest) {
                $("#qrTestFlow").show();
                var testButtons = "\n<div id=\"inputTypeButtons\">\n\t<p>" + Resources.testSelectInputTypeDescription + ":</p>\n\t<div class=\"qr-input-group\">\n\t\t<button type=\"button\" id=\"qrInputTypeButton\" class=\"qr-blue-button test-button\">QR-Code</button>\n\t\t<button type=\"button\" id=\"urlInputTypeButton\" class=\"qr-blue-button test-button\">URL-Intent</button>\n\t</div>\n</div>\n";
                $("#qrTestFlow").append(testButtons);
                $(document).on("click", "#qrInputTypeButton", function () {
                    sendTestInputTypeData("QrCode", data.TransactionKey);
                });
                $(document).on("click", "#urlInputTypeButton", function () {
                    sendTestInputTypeData("UrlIntent", data.TransactionKey);
                });
            }
            else {
                $("#qrTestFlow").hide();
                // mobile flow
                if (/iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                    window.location.href = data.UrlIntentData;
                    return;
                }
                // no QrUrl available? do nothing
                if (!data.QrUrl) {
                    return;
                }
            }
            qrLoaded = true;
            // desktop flow
            var image = $("<img src=\"" + data.QrUrl + "\" style=\"opacity: 0;\" height=\"400\" width=\"400\" class=\"img-fluid\" />");
            $("#qrImage").append(image);
            image.delay(500).fadeTo(200, 1);
            $("#qrProgress").removeClass(progressClasses);
            $("#qrProgress").addClass("waiting");
        };
        var setupWebSocketChannel = function (transactionKey) {
            var url = Base.websocketUrl + "BancontactMobile/" + transactionKey;
            Base.setupWebSocket(url, function (event) {
                // get response object from event
                var responseObj = JSON.parse(event.data);
                // remove any progress classes
                $("#qrProgress").removeClass(progressClasses);
                switch (responseObj.status) {
                    case "WAITING":
                        $("#qrProgress").addClass("waiting");
                        $("#close-qr-popup").show();
                        callbackHandler(responseObj.status, []);
                        break;
                    case "PROCESSING":
                        $("#qrProgress").addClass("scanned");
                        $("#close-qr-popup").show();
                        callbackHandler(responseObj.status, []);
                        break;
                    case "SUCCESS":
                        $("#qrProgress").addClass("success");
                        $("#close-qr-popup").hide();
                        if (callbackHandler(responseObj.status, [responseObj.redirectUrl])) {
                            // redirect to URL (after 3 seconds)
                            setTimeout(function () { window.location.href = responseObj.redirectUrl; }, 3000);
                        }
                        break;
                    case "FAILED":
                        $("#qrProgress").addClass("failed");
                        $("#close-qr-popup").hide();
                        if (callbackHandler(responseObj.status, [responseObj.redirectUrl])) {
                            // redirect to URL (after 3 seconds)
                            setTimeout(function () { window.location.href = responseObj.redirectUrl; }, 3000);
                        }
                        break;
                }
            });
        };
        BancontactMobile.initiate = function (containerSelector, trxKey, callback) {
            if (callback === void 0) { callback = null; }
            transactionKey = trxKey;
            callbackHandler = callback || (function () { return true; });
            // Inject qr button at #insertBancontactQrButton
            var buttonHtml = "<div class=\"qr-input-group\">\n\t<div class=\"qr-pink-prepend\">\n\t\t<span class=\"qr-pink-prepend-image\">\n\t\t\t<img src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMjHxIGmVAAAGvUlEQVR4XuVaTWskRRjOTCafZpMsWXJSAhs8ePEyKrlkA4JsQMhBmMWDGDwY2Yv+hFz0D3gzLnrzEsLC/gHB8+I/SDzkIiwkIHpYxV2f501V79vvVHdVz/R0JuMLRXc99X7UW1P9TFV1TxlpHR4ett29l0nGXgkbd3d353DbukImG4O0e73etNxRYWdnZykDILyfZGxra2sBtzIgLY6OVdjb27s1yRh/dAHcTTY1qjq66VhOUo0mBctJQOGTVqt1NDs7+yOuj1A/YknEusbfdoFeIba8vHxfd7bT6bwzYF+O2u32fiD5chKko05n+iWuL1GVwvsUDAE/NgEPUm09Bh8HqIvQz+Li4qepthbjgOjceB8lQTeKUechjJ3V/phMqq3CZADoh4PJQS3QS8E4E0S8vygJwohTaKCA6OwD1EXob2Fh4ctUW4Ud+L7winqvQC8FkwEw/vrFKNBIOzpH/ZgF9yczM53HuEod5bnSY0B2NvM3PT193+mFbAWD7V/OVgoG8aHpbI/tKsZzlCJ/50qP5cjk1i8BBRKKDkjnwVFE+4UJiOZ+vTIMtmeoij39cNZoPc4qE+OiyJ8bEK9Hm0dWD1KZBI/ZHgoIvUsdkM9rUaIl2CmKxGNc+IiR4GWRP7SdoOr1aiPBk5KAl6hmAS0Jer0IdkpbNegxErws8cfZ6vV4HZ4EOa1KAl6gZAE5XUUJwvZut3tnaWnpDqq3WVZWVm4rWxHYnqrkZQBMDEuCjCli9CjkAT2YtZCgcAAl4OjCBMyRIAbkIarZYELvN2UresScrRTamBiWBGUAfAztD+3HSo/l2kmQ09knzyufdxGvB2zsSZB/dUyUhMdnnr8Af3liL5ReiATtSlAGgO1KryoJvijoC7G/ld5YrgRP2W4GqSoJ9sUtwYYnwSoBOV1RF6G/wErwzCQ/CAlqfzGsFhKsErAJEtT+YthAJNjltON0dr8ok+olYq8bf1ESxHL5Q1ZZ6G99ff1t1Zep+fn5jQH70sNW+r1A8vEzQWs0BJZCgiJNYY2eCeLXSCHB2uOWYVESTHWUgqWQYJHtqLGcGAUeYx3w12MCuJLI+CxXxpDwT6j75Pko9JEgntvPUv05bB8lmBT45ANjux3Sy0lAwa4EdQLDYtGVYIK/xleCoU4MikVXgiW2Hmt8OzxIokVYykqwyNZjzW6H4ehPXPkrScH9GTAuXgbBfjHJh1aCz4zt78TZ7vTGajs8NOYS9cnfrO1wHRhi3NwzwZowTnOJx7j8yxMlCNu5vDVJjc+ZYE2YJUEZAK+HARmvM0Ge68H5Gdo4dT25kcjO3MZGhDZc5AT0+Mxr7B/XWT/odjv8Gspd/DBvcqM0Nzd3F3URo0cZPQlubm6+oTqr9VjnLizz51ZkIb1CLECCwQRCGPyMngTdKa8EMHosUMv543QO6RVilgSNP5EirCkS5BF3MAE+rybg0G+HU5MnBh/DkyDfz7tOSOH7PRNwjtPUbToyPWL2MIPtJtFnRbYKewslS4qHGqjyseTMjH0XkPtHYRvqIt5flAR1AsNiTIqdQdX/KoNsh8krOintL4YNRIIidWD8ZVHVHevbDif4a/xMsE6MU1p3jFNUJMFWBINoV4KhRIuw6iTIb3Lc4SIXIP7A8UEKxgNME9CSIDc2pf74f4+6CP1g3fE+bPlPJAX3we8MQhgewa90bry/7hcjhbYK46xJniFVsSgJohOjfDGS4s+uBEXqxnJiFOxKsKyzFuN0zvxhQBpdCaZiOQko2JUgv8nhC8hLYHwBKS8kHcYXlToBuMn54wFmka3H/kVd7OmHs0b1ZWpjY2Oey2/9nQHvU7C1tbVbgeTr2w67BLxeaCWY8qvkFi/kDVGCsJ28omN4vRRsoJVggATH7RMZr5eCVV8Jwqh0O+z1HMbpnAVEZ3MkaBINYrAd+7fD/F8VCTjis6wD5khQ6RVisK16JiglEbv2T2Q+QnmK9qfQ+xXXJ6iLeD1gVc8E/+AGaXV19R6u76LeZSE2MzPzs9KjzWjPBKEXI8FRfCLT+JnguVtm0rlfZh47LPdNTmAl+IUZzDo+kWn8xYjvWBTjdEVdhP5StsPAqpIgiVfE6FFGciaoE4hhsZXgjfxOUEoiBjc5f5zOWq9vOwxsvF6MIOC+4wHOBCl0lIKRiU3AbbR/Pzvb+QHX71D/miDbld43KJk/+LhHHQrbwfb0oeN+G0qemJtxWf/ASZ9bvSgJFjmfFCxKgqmObjqWk1SjScFykmo0KRjkFQlC2iSF7Lm4konGQPrzuF49+m4kMh6g/D+wqan/AMH+nqQl1MSJAAAAAElFTkSuQmCC\" width=\"24\"></img>\n\t\t</span>\n\t</div>\n\t<button type=\"button\" id=\"qrButton\" class=\"qr-blue-button\">" + Resources.bancontactApp + "</button>\n</div>";
            $(containerSelector).append(buttonHtml);
            // Inject popup html in body
            var bodyHtml = "<div class=\"qr-popup hidden\" id=\"bancontactMobilePopup\" tabindex=\"-1\" role=\"dialog\" aria-hidden=\"true\">\n\t<div class=\"popup-dialog\" role=\"document\">\n\t\t<div class=\"popup-content\">\n\t\t\t<div class=\"popup-header\"> \n\t\t\t\t<h5 class=\"popup-title\" id=\"examplepopupLabel\">" + Resources.scanCodeText + "</h5>\n\t\t\t</div>\n\t\t\t<div class=\"popup-body text-align-center\">\n\t\t\t\t<div id=\"qrProgress\" class=\"waiting\">\n\t\t\t\t\t<p>" + Resources.description.replace("{0}", Resources.link).replace("{1}", Resources.bancontactApp) + "</p>\n\t\t\t\t\t<div class=\"p-4\">\n\t\t\t\t\t\t<div id=\"qrImage\" class=\"if if-waiting\">\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div id=\"check\" class=\"if if-scanned if-success if-failed\">\n\t\t\t\t\t\t\t<div class=\"circle-loader\">\n\t\t\t\t\t\t\t\t<div class=\"checkmark draw if if-success\"></div>\n\t\t\t\t\t\t\t\t<div class=\"cross if if-failed\"></div>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<p class=\"if if-scanned pt-4 m-0\">" + Resources.finish + "</p>\n\t\t\t\t\t\t\t<p class=\"if if-success pt-4 m-0 text-success\">" + Resources.succeeded + " " + Resources.redirect + "</p>\n\t\t\t\t\t\t\t<p class=\"if if-failed pt-4 m-0 text-failed\">" + Resources.failed + " " + Resources.redirect + "</p>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div id=\"qrTestFlow\" hidden>\t\t\t\t\t\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<div class=\"popup-footer\">\n\t\t\t\t<button id=\"close-qr-popup\" type=\"button\">" + Resources.cancel + "</button>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>";
            document.body.insertAdjacentHTML("beforeend", bodyHtml);
            $(document).on("click", "#close-qr-popup", function () {
                $(".qr-popup").hide();
            });
            $(document).on("click", "#qrButton", function () {
                if (qrLoaded === false) {
                    // get qr url
                    getCodeUrl(transactionKey).done(renderQrOrRedirectToApp);
                    // setup websocket
                    setupWebSocketChannel(transactionKey);
                }
                $(".qr-popup").show();
            });
        };
    })(BancontactMobile = BuckarooSdk.BancontactMobile || (BuckarooSdk.BancontactMobile = {}));
    var ApplePay;
    (function (ApplePay) {
        var merchantIdentifier = "merchant.nl.buckaroo.mastermerchant";
        ApplePay.checkApplePaySupport = function () {
            if (!("ApplePaySession" in window))
                return Promise.resolve(false);
            if (ApplePaySession === undefined)
                return Promise.resolve(false);
            return ApplePaySession.canMakePaymentsWithActiveCard(merchantIdentifier);
        };
        var ApplePayPayment = /** @class */ (function () {
            function ApplePayPayment(buttonSelector, options) {
                var _this = this;
                this.applePayVersion = 3;
                this.validationUrl = "https://applepay.buckaroo.io/v1/request-session";
                this.beginPayment = function (e) {
                    e.preventDefault();
                    var paymentRequest = {
                        countryCode: _this.options.countryCode,
                        currencyCode: _this.options.currencyCode,
                        merchantCapabilities: ["supports3DS", "supportsCredit", "supportsDebit"],
                        supportedNetworks: ["masterCard", "visa", "maestro", "vPay", "cartesBancaires", "privateLabel"],
                        lineItems: _this.options.lineItems,
                        total: _this.options.totalLineItem,
                        requiredBillingContactFields: ["email", "name", "phone", "postalAddress"],
                        requiredShippingContactFields: ["email", "name", "phone", "postalAddress"],
                        shippingType: _this.options.shippingType,
                        shippingMethods: _this.options.shippingMethods,
                        supportedCountries: [_this.options.countryCode]
                    };
                    // Create the Apple Pay session.
                    _this.session = new ApplePaySession(_this.applePayVersion, paymentRequest);
                    // Setup handler for validation the merchant session.
                    _this.session.onvalidatemerchant = _this.onValidateMerchant;
                    // Setup handler for shipping method selection.
                    _this.session.onshippingmethodselected = _this.onShippingMethodSelected;
                    // Setup handler to receive the token when payment is authorized.
                    _this.session.onpaymentauthorized = _this.onPaymentAuthorized;
                    // Begin the session to display the Apple Pay sheet.
                    _this.session.begin();
                };
                /**
                 * Handles merchant validation for the Apple Pay session.
                 * @param event - The ApplePayValidateMerchantEvent object.
                 */
                this.onValidateMerchant = function (event) {
                    // Create the payload.
                    var data = {
                        validationUrl: event.validationURL,
                        displayName: _this.options.storeName,
                        domainName: window.location.hostname
                    };
                    var request = {
                        url: _this.validationUrl,
                        method: "POST",
                        contentType: "application/json; charset=utf-8",
                        data: JSON.stringify(data)
                    };
                    // Post the payload to the server to validate the
                    // merchant session using the merchant certificate.
                    $.ajax(request).then(function (merchantSession) {
                        // Complete validation by passing the merchant session to the Apple Pay session.
                        _this.session.completeMerchantValidation(merchantSession);
                    });
                };
                /**
                 * Handles the Apple Pay payment being authorized by the user.
                 * @param event - The ApplePayPaymentAuthorizedEvent object.
                 */
                this.onPaymentAuthorized = function (event) {
                    // Get the payment data for use to capture funds from
                    // the encrypted Apple Pay token in your server.
                    var payment = event.payment;
                    // Process the payment
                    _this.options.processCallback(payment).then(function (authorizationResult) {
                        // Complete payment
                        _this.session.completePayment(authorizationResult);
                    });
                };
                /**
                 * Handles the shipping method being changed by the user
                 * @param event - The ApplePayShippingMethodSelectedEvent object.
                 */
                this.onShippingMethodSelected = function (event) {
                    if (!_this.options.shippingMethodSelectedCallback)
                        return;
                    _this.options.shippingMethodSelectedCallback(event.shippingMethod).then(function (result) {
                        if (!result)
                            return;
                        _this.session.completeShippingMethodSelection(result);
                    });
                };
                this.button = $(buttonSelector);
                this.options = options;
                this.validate();
            }
            ApplePayPayment.prototype.validate = function () {
                if (!this.button.length)
                    throw "ApplePay: button element does not exist";
                if (!this.options.processCallback)
                    throw "ApplePay: processCallback must be set";
                if (!this.options.storeName)
                    throw "ApplePay: storeName is not set";
                if (!this.options.countryCode)
                    throw "ApplePay: countryCode is not set";
                if (!this.options.currencyCode)
                    throw "ApplePay: currencyCode is not set";
            };
            ApplePayPayment.prototype.showPayButton = function (buttonStyle) {
                if (buttonStyle === void 0) { buttonStyle = "black"; }
                this.button.attr("lang", this.options.cultureCode);
                this.button.on("click", this.beginPayment);
                this.button.addClass("apple-pay apple-pay-button");
                switch (buttonStyle) {
                    case "black":
                        this.button.addClass("apple-pay-button-black");
                        break;
                    case "white":
                        this.button.addClass("apple-pay-button-white");
                        break;
                    case "white-outline":
                        this.button.addClass("apple-pay-button-white-with-line");
                        break;
                }
            };
            return ApplePayPayment;
        }());
        ApplePay.ApplePayPayment = ApplePayPayment;
        var ApplePayOptions = /** @class */ (function () {
            function ApplePayOptions(storeName, countryCode, currencyCode, cultureCode, lineItems, totalLineItem, shippingType, shippingMethods, processCallback, shippingMethodSelectedCallback) {
                if (shippingMethodSelectedCallback === void 0) { shippingMethodSelectedCallback = null; }
                this.storeName = storeName;
                this.countryCode = countryCode;
                this.currencyCode = currencyCode;
                this.cultureCode = cultureCode;
                this.lineItems = lineItems;
                this.totalLineItem = totalLineItem;
                this.shippingType = shippingType;
                this.shippingMethods = shippingMethods;
                this.processCallback = processCallback;
                this.shippingMethodSelectedCallback = shippingMethodSelectedCallback;
            }
            return ApplePayOptions;
        }());
        ApplePay.ApplePayOptions = ApplePayOptions;
    })(ApplePay = BuckarooSdk.ApplePay || (BuckarooSdk.ApplePay = {}));
})(BuckarooSdk || (BuckarooSdk = {}));
//# sourceMappingURL=BuckarooSdk.js.map