// Description: This script is executed when the popup is opened.
// It is linked in the popup.html's script tag.
// Like content.js, it can send/receive messages to/from background.js via chrome.runtime.sendMessage.
// It adds an event listener to the classify button to extract the main content from the active tab
// and sends it to the background script for classification.
// The classification result is then displayed in the popup.
// const port = chrome.runtime.connect();

document.addEventListener("DOMContentLoaded", () => {
  // This log and the above log are within the service worker context (background.js)
  // console.log("Popup loaded: port", port);
  const classifyButton = document.getElementById("classify");

  if (classifyButton) {
    classifyButton.addEventListener("click", () => {
      const resultElement = document.getElementById("result");
      const extractedTextElement = document.getElementById("extracted-text");
      const sourceElement = document.getElementById("source");

      // Update the button to indicate classification is in progress
      classifyButton.disabled = true;
      classifyButton.style.backgroundColor = "#cccccc"; // Change to gray
      classifyButton.innerText = "Classifying...";

      resultElement.innerText = ""; // Clear previous result
      extractedTextElement.innerText = ""; // Clear previous text
      extractedTextElement.style.display = "none"; // Hide extracted text container
      sourceElement.innerText = ""; // Clear previous source

      // Get the current active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          classifyButton.disabled = false;
          classifyButton.style.backgroundColor = ""; // Revert to default color
          classifyButton.innerText = "Classify"; // Reset button text
          resultElement.innerText = "No active tab found!";
          return;
        }
        // Extract main content from the active tab
        // Page DOM is accessible in executeScript func call
        chrome.scripting.executeScript(
          /* chrome.scripting.executeScript can either inject a file, 
            or run a function inlined in the func property */
          {
            target: { tabId: tabs[0].id },
            func: () => {
              // This function runs in the context of the page and logs to the console of the page
              console.log('PAGE REFERENCE', window.location.href);
              const selectors = ["#mw-content-text", "main", "article"];
              for (let selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.innerText.trim()) {
                  return {
                    text: element.innerText.substring(0, 5000),
                    source: selector,
                    url: window.location.href
                  };
                }
              }
              // Fallback to extracting the entire page text
              return {
                text: document.body.innerText.substring(0, 5000),
                source: "all",
                url: window.location.href
              };
            },
          },
          // the func call resolves with the return value of func
          (injectionResults) => {
            // This function runs in the context of the service worker and runs in that context
            console.log('INJECTION RESULTS', injectionResults);
            if (chrome.runtime.lastError) {
              classifyButton.disabled = false;
              classifyButton.style.backgroundColor = ""; // Revert to default color
              classifyButton.innerText = "Classify"; // Reset button text
              resultElement.innerText =
                "Error extracting page content: " +
                chrome.runtime.lastError.message;
              return;
            }

            const pageData = injectionResults[0].result;
            console.log(pageData);

            // Display the source of the text
            sourceElement.innerText = `Extracted Text Source: ${pageData.source}`;

            // Display the extracted text
            extractedTextElement.style.display = "block"; // Show the extracted text container
            extractedTextElement.innerText = `${pageData.text}`;

            // Send the page content to the background script for classification
            chrome.runtime.sendMessage(
              { action: "classifyPage", content: pageData.text },
              (response) => {
                classifyButton.disabled = false;
                classifyButton.style.backgroundColor = ""; // Revert to default color
                classifyButton.innerText = "Classify"; // Reset button text
                if (response && response.subject) {
                  resultElement.innerHTML = `This page is classified as: <span>${response.subject}</span>`;
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
