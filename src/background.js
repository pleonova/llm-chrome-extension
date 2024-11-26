// Engine of state for application
// Listens for events and messages from the content script or main popup script
// Makes API requests when necessary and sends responses back to their origin
import './sw-omnibox.js';
import { injectColor } from './utils/injects.js';
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "OFF" });
});

// Note: The action.onClicked event won't be sent
// if the extension action has specified a popup to show on click of the current tab.
// This only runs when their is no popup to show in manifest.json.
// "action": { "default_popup": "popup.html" } negates this onClicked event.
// https://developer.chrome.com/docs/extensions/reference/api/action#popup
chrome.action.onClicked.addListener(async (tab) => {});

// This listens for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(sender.tab ? "message from content script:" + sender.tab.url : "message from extension");

  if (message.greeting === "hello from content.js" || message.greeting === "hello from popup.js") {
    sendResponse({ response: "hello back from background.js" });
  }
  console.log('message', message);
});