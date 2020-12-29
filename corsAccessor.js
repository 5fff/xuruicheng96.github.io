
let iframeHostName = "https://www.x-r-c.com";
let iframeURL = 'https://www.x-r-c.com/corsService';

let defaultEnv = "POC";
let envConfig = {
    POC: [
        "https://www.x-r-c.com/corsService",
        "https://www.x-r-c.com/corsService"
    ],
    DIT: [
        "https://",
        "https://"
    ]
}

//pendingResponses keeps records for pending responses
//one outgoing message corresponds to one incoming reponses, uniquely identified by messageId
let pendingResponses = new Map();

//unique message id counter
let messageId = 0;

//receiving messages from iframe
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
function sendRequest(corsService, request) {
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

    // corsService.postMessage(JSON.stringify({request: request, messageId: messageId}), "*");
    let thisMessageId = messageId;
    messageId++;
    corsService.addEventListener("load", function() {
        corsService.postMessage(JSON.stringify({request: request, messageId: thisMessageId}), "*");
    });

    return reply; // a Promise
}



//get Cookie wrapper method
//parameters: none
//return: all cookies as a raw string
//detail: this function will use sendMessage and add a type
// function getAllCookiesRaw() {
//     let request = JSON.stringify({method: "getAllCookiesRaw"});
//     return sendRequest(request);
// }

// function getCookie(name) {
//     let request = JSON.stringify({method: "getCookie", name: name});
//     return sendRequest(request);
// }

// function setCookie(name, value) {
//     let request = JSON.stringify({method: "setCookie", name: name, value: value});
//     return sendRequest(request);
// }

function setMultipleCookies(corsService, cookiesArray) {
    let request = JSON.stringify({method: "setMultipleCookies", cookiesArrayJSON: JSON.stringify(cookiesArray)});
    return sendRequest(corsService, request);
}

function createAccessor(targetSrc) {
    let corsServiceElement = document.createElement('iframe');
    // corsServiceElement.style.display = "none";
    document.body.appendChild(corsServiceElement);
    corsServiceElement.setAttribute('src', iframeSrcUrl);
    let corsService = corsServiceElement.contentWindow;
    return corsService;
}
// 
let crsCookieManager = {};
//this function returns a promise
crsCookieManager.updateCookie = async function() {
    if(!crsCookieManager.cookieData) {
        console.log("ERROR: Missing Attribute cookieData");
        return;
    }
    if(!this.cookieData.env){
        this.cookieData.env = defaultEnv;
    }
    //use bracket notation to access object attribute as string
    let iframeSrcUrlList = envConfig[crsCookieManager.cookieData.env];
    for(iframeSrcUrl of iframeSrcUrlList) {
        let corsService = createAccessor(iframeSrcUrl);
        //must wait for request finish before changing iframe
        await setMultipleCookies(corsService, this.cookieData.cookies);
    }
    return "success";
}

