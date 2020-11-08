
let iframeHostName = "www.x-r-c.com";
let iframeURL = 'https://www.x-r-c.com/cookieaccessor';

function init() {
    var corsService = document.createElement('iframe');
    corsService.setAttribute('src', iframeURL);
    var pendingResponses = new Map();
    var messageId = 0;
    window.onmessage = function(msg) {

        if (msg.origin !== iframeHostName) {
            return;
        }
        let payload = JSON.parse(msg.data);
        if(payload.msgId == undefined || !pendingResponses.has(payload.msgId)){
            return;
        }
        pendingResponses.get(payload.msgId).complete(payload.response);
        pendingResponses.delete(payload.msgId);
    };
}

//return an promise as pending response
//Non blocking
//parameter: req, a string
function sendRequest(request) {
    let tmpCompleteFn, tmpErrorFn;
    let reply = new Promise(
        (completeFn, errorFn) => {
            tmpCompleteFn = completeFn;
            tmpErrorFn = errorFn;
        }
    );
    //attaching it's complete() and fail() method on the out side
    reply.complete = tmpCompleteFn;
    reply.error = tmpErrorFn;
    pendingResponses.set(messageId++, reply); //must put in Map before post message
    corsService.postMessage(JSON.stringify({request: request, msgId: messageId}), "*");
    return reply; // a Promise
}



//get Cookie wrapper method
//parameters: none
//return: all cookies as a raw string
//detail: this function will use sendMessage and add a type
function getAllCookiesRaw() {
    let request = JSON.stringify({method: "getAllCookiesRaw"});
    return sendRequest(request);
}

function getCookie(name) {
    let request = JSON.stringify({method: "getCookie", name: name});
    return sendRequest(request);
}

function setCookie(name, value) {
    let request = JSON.stringify({method: "setCookie", name: name, value: value});
    return sendRequest(request);
}

// 