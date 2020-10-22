function setCookie() {
    var cookieName = "HelloWorld";
    var cookieValue = "HelloWorld";
    var myDate = Date();
    myDate.setMonth(myDate)
    document.cookie = "localhostcookie=hellolocalhost;Domain=localhost";
    console.log(document.cookie);
}