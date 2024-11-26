import { YoutubeTranscript } from "youtube-transcript";

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
