document.addEventListener("DOMContentLoaded", () => {
  const classifyButton = document.getElementById("classify");

  if (classifyButton) {
    classifyButton.addEventListener("click", () => {
      const loadingIndicator = document.getElementById("loading");
      const resultElement = document.getElementById("result");

      resultElement.innerText = ""; // Clear previous result
      loadingIndicator.style.display = "block"; // Show loading indicator

      // Get the current active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          loadingIndicator.style.display = "none";
          resultElement.innerText = "No active tab found!";
          return;
        }

        // Extract content from the active tab
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: () => document.body.innerText,
          },
          (injectionResults) => {
            if (chrome.runtime.lastError) {
              loadingIndicator.style.display = "none";
              resultElement.innerText =
                "Error extracting page content: " + chrome.runtime.lastError.message;
              return;
            }

            const pageContent = injectionResults[0].result;

            // Send the page content to the background script for classification
            chrome.runtime.sendMessage(
              { action: "classifyPage", content: pageContent },
              (response) => {
                loadingIndicator.style.display = "none"; // Hide loading indicator
                if (response && response.subject) {
                  resultElement.innerText = `This page is classified as: ${response.subject}`;
                } else {
                  resultElement.innerText = "Failed to classify the page.";
                }
              }
            );
          }
        );
      });
    });
  } else {
    console.error("Element with ID 'classify' not found in popup.html");
  }
});
