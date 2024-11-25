// Runs on page load
// Can send/revcieve messages to background.js
// Interacts with the DOM of the webpage
// Purpose: Get information from the webpage and send it to background.js
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
