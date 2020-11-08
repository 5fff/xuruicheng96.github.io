
let iframeHostName = "https://www.x-r-c.com";
let iframeURL = 'https://www.x-r-c.com/corsService';

let corsServiceElement = document.createElement('iframe');
corsServiceElement.setAttribute('src', iframeURL);
corsServiceElement.setAttribute('id', 'corsServiceIframe');
document.body.appendChild(corsServiceElement);
corsService = corsServiceElement.contentWindow;
let pendingResponses = new Map();
let messageId = 0;
window.onmessage = function(msg) {
    if (msg.origin !== iframeHostName) {
        return;
    }
    let payload = JSON.parse(msg.data);
    if(payload.messageId == undefined || !pendingResponses.has(payload.messageId)){
        return;
    }
    pendingResponses.get(payload.messageId).complete(payload.response);
    pendingResponses.delete(payload.messageId);
};

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
    pendingResponses.set(messageId, reply); //must put in Map before post message
    corsService.postMessage(JSON.stringify({request: request, messageId: messageId}), "*");
    messageId++;
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