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
// chrome.action.onClicked.addListener(async (tab) => {
//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     func: injectColor,
//   });

//   if (tab.url.startsWith(youtube) || tab.url.startsWith(wikipedia)) {
//     const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
//     const nextState = prevState === "ON" ? "OFF" : "ON";
//     await chrome.action.setBadgeText({
//       tabId: tab.id,
//       text: nextState,
//     });
//   }
// });

// This listens for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "classifyPage") {
    const apiUrl = "https://pleonova-subject-matter.hf.space/predict";

    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [message.content] // Send the extracted page content to the API
      }),
    })
      .then((response) => {
        if (!response.ok) {
          console.error(`API responded with status ${response.status}`);
          return response.text(); // Attempt to read raw text response
        }
        return response.json(); // Parse JSON if response is OK
      })
      .then((data) => {
        if (data && typeof data === "string") {
          console.error("Unexpected response format:", data);
          sendResponse({ subject: "Error - Unexpected response from API" });
        } else if (data && data.label) {
          sendResponse({ subject: data.label }); // Pass the classification back
        } else {
          sendResponse({ subject: "Unknown" });
        }
      })
      .catch((error) => {
        console.error("Error calling API:", error);
        sendResponse({ subject: "Error - API call failed" });
      });

    return true; // Keep the message channel open for async responses
  }
});
