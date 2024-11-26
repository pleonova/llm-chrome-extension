// Description: This script is executed when the popup is opened.
// It is linked in the popup.html's script tag.
// Like content.js, it can send/receive messages to/from background.js via chrome.runtime.sendMessage.
// It adds an event listener to the classify button to extract the main content from the active tab
// and sends it to the background script for classification.
// The classification result is then displayed in the popup.
// const port = chrome.runtime.connect();

document.addEventListener("DOMContentLoaded", () => {
  // This file operates within the extension's context and not the webpage.
  const classifyButton = document.getElementById("classify");

  if (classifyButton) {
    classifyButton.addEventListener("click", () => {
      window.console.log('clicked in extension');
      initMessage();
    });
  }
  // call this response immmmediately
  (async () => {
    const response = await chrome.runtime.sendMessage({greeting: "hello from iife popup.js"});
    console.log(response);
    return 'done';
  })();
});

async function initMessage() {
  const response = await chrome.runtime.sendMessage({greeting: "hello from initMessage popup.js"});
  console.log(response);
  return 'finished';;
}