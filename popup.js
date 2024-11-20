document.addEventListener("DOMContentLoaded", () => {
  const classifyButton = document.getElementById("classify");

  if (classifyButton) {
    classifyButton.addEventListener("click", () => {
      const loadingIndicator = document.getElementById("loading");
      const resultElement = document.getElementById("result");
      const extractedTextElement = document.getElementById("extracted-text");
      const sourceElement = document.getElementById("source");

      resultElement.innerText = ""; // Clear previous result
      extractedTextElement.innerText = ""; // Clear previous text
      extractedTextElement.style.display = "none"; // Hide extracted text container
      sourceElement.innerText = ""; // Clear previous source
      loadingIndicator.style.display = "block"; // Show loading indicator

      // Get the current active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          loadingIndicator.style.display = "none";
          resultElement.innerText = "No active tab found!";
          return;
        }

        // Extract main content from the active tab
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: () => {
              // Attempt to extract main content first
              const selectors = ["#mw-content-text", "main", "article"];
              for (let selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.innerText.trim()) {
                  return { text: element.innerText.substring(0, 5000), source: selector };
                }
              }
              // Fallback to extracting the entire page text
              return { text: document.body.innerText.substring(0, 5000), source: "all" };
            },
          },
          (injectionResults) => {
            if (chrome.runtime.lastError) {
              loadingIndicator.style.display = "none";
              resultElement.innerText =
                "Error extracting page content: " +
                chrome.runtime.lastError.message;
              return;
            }

            const pageData = injectionResults[0].result;

            // Display the source of the text
            sourceElement.innerText = `Source: ${pageData.source}`;

            // Display the extracted text
            extractedTextElement.style.display = "block"; // Show the extracted text container
            extractedTextElement.innerText = `Extracted Text:\n${pageData.text}`;

            // Send the page content to the background script for classification
            chrome.runtime.sendMessage(
              { action: "classifyPage", content: pageData.text },
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
