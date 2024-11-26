// Content scripts run in the context of a web page, not the extension that runs them
// Content scripts can interact with the DOM of the webpage
// Can send/revceive messages to the extension's service worker (background.js)

/** Content scripts can either be declared statically in manifest.json
 *  which will run on every page 
 * "content_scripts": ['content.js']

    or get programmatically injected by using
    chrome.scripting.executeScript({target: { tabId: tab.id }, files: [content.js] });
*/ 
console.log("Hello from the content script!", window.location.href);
// Since content scripts are often injected, we need a way to call this response immmmediately
// One way is to use an iife
// (async () => {
//     const response = await chrome.runtime.sendMessage({greeting: "hello from content.js", url: window.location.href});
//     console.log(response);
// })();

// another way is to just call a function when this script is injected
async function getPageInfo() {
    const response = await chrome.runtime.sendMessage({greeting: "content.js sends page info", url: window.location.href});
    console.log(response);
}

getPageInfo();