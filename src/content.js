// Content scripts can interact with the DOM of the webpage
// Can send/revceive messages to the extension's service worker (background.js)

/** Content scripts can either be declared statically in manifest.json
 *  which will run on every page 
 * "content_scripts": ['content.js']

    or get programmatically injected by using
    chrome.scripting.executeScript({target: { tabId: tab.id }, files: [content.js] });
*/ 


import { YoutubeTranscript } from "youtube-transcript";

window.console.log("Hello from the content script!", window.location.href);

async function getTranscript(youTubeId) {
    let parsedTranscript = '';

    const transcript = await YoutubeTranscript.fetchTranscript(youTubeId)

    if (!transcript) {
        // should signal that we don't need to transcribe... assume we're on a text page
        window.console.log("No transcript found");
    }

    for await (const text of transcript) {
        parsedTranscript += text.text + " ";
    }
    window.console.log('transcript?', parsedTranscript);
    return parsedTranscript;
}
