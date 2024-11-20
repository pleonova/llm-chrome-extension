document.addEventListener("DOMContentLoaded", () => {
  const classifyButton = document.getElementById("classify");

  if (classifyButton) {
    classifyButton.addEventListener("click", () => {
      const loadingIndicator = document.getElementById("loading");
      const resultElement = document.getElementById("result");
      const extractedTextElement = document.getElementById("extracted-text");

      resultElement.innerText = ""; // Clear previous result
      extractedTextElement.innerText = ""; // Clear previous text
      extractedTextElement.style.display = "none"; // Hide extracted text container
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
            func: () => document.body.innerText.substring(0, 5000), // Limit to 5000 characters
          },
          (injectionResults) => {
            if (chrome.runtime.lastError) {
              loadingIndicator.style.display = "none";
              resultElement.innerText =
                "Error extracting page content: " +
                chrome.runtime.lastError.message;
              return;
            }

            const pageContent = injectionResults[0].result;

            // Display the extracted text
            extractedTextElement.style.display = "block"; // Show the extracted text container
            extractedTextElement.innerText = `Extracted Text:\n${pageContent}`;

            // Send the page content to the background script for classification
            chrome.runtime.sendMessage(
              { action: "classifyPage", content: pageContent },
              (response) => {
                loadingIndicator.style.display = "none"; // Hide loading indicator
                if (response && response.subject) {
                  resultElement.innerText = `This page is classified as: ${response.subject}`;
                } else {
                  resultElement.innerText = "Classification failed.";
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
