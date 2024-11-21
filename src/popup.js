console.log("popup.js loaded successfully");

document.addEventListener("DOMContentLoaded", () => {
  const classifyButton = document.getElementById("classify");
  const viewResponsesButton = document.getElementById("view-responses");
  const tableBody = document.getElementById("responses-list");
  const responsesTable = document.getElementById("responses-table");

  // Function to store classifications
  const storeClassification = (subject, url) => {
    const timestamp = new Date().toISOString();
    chrome.storage.sync.get("responses", (data) => {
      const responses = data.responses || [];
      responses.push({ subject, url, timestamp });
      chrome.storage.sync.set({ responses }, () => {
        console.log("Classification stored successfully:", { subject, url, timestamp });
      });
    });
  };

  // Function to display past classifications
  const displayResponses = () => {
    chrome.storage.sync.get("responses", (data) => {
      const responses = data.responses || [];
      tableBody.innerHTML = ""; // Clear previous entries

      if (responses.length === 0) {
        console.log("No past classifications found");
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 3;
        cell.textContent = "No past classifications found.";
        cell.style.textAlign = "center";
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
      }

      console.log("Displaying stored responses:", responses);

      responses.forEach((response) => {
        const row = document.createElement("tr");

        // Subject Column
        const subjectCell = document.createElement("td");
        subjectCell.textContent = response.subject || "N/A";
        row.appendChild(subjectCell);

        // URL Column
        const urlCell = document.createElement("td");
        const urlLink = document.createElement("a");
        urlLink.href = response.url;
        urlLink.textContent = response.url.length > 50 ? response.url.substring(0, 47) + "..." : response.url; // Truncate if too long
        urlLink.title = response.url; // Full URL on hover
        urlLink.target = "_blank"; // Open in new tab
        urlCell.appendChild(urlLink);
        urlCell.style.wordWrap = "break-word";
        urlCell.style.maxWidth = "200px"; // Limit width
        row.appendChild(urlCell);

        // Timestamp Column
        const timestampCell = document.createElement("td");
        timestampCell.textContent = new Date(response.timestamp).toLocaleString();
        row.appendChild(timestampCell);

        tableBody.appendChild(row);
      });

      responsesTable.style.display = "table"; // Show the table
    });
  };

  // Function to handle the "Classify" button logic
  const classifyPage = () => {
    const resultElement = document.getElementById("result");
    const extractedTextElement = document.getElementById("extracted-text");
    const sourceElement = document.getElementById("source");

    classifyButton.disabled = true;
    classifyButton.style.backgroundColor = "#cccccc"; // Indicate loading
    classifyButton.innerText = "Classifying...";

    resultElement.innerText = ""; // Clear previous result
    extractedTextElement.innerText = ""; // Clear previous text
    extractedTextElement.style.display = "none"; // Hide extracted text
    sourceElement.innerText = ""; // Clear source

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found");
        classifyButton.disabled = false;
        classifyButton.style.backgroundColor = ""; // Reset button color
        classifyButton.innerText = "Classify"; // Reset button text
        resultElement.innerText = "No active tab found!";
        return;
      }

      // Extract content from the current page
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => {
            const selectors = ["#mw-content-text", "main", "article"];
            for (let selector of selectors) {
              const element = document.querySelector(selector);
              if (element && element.innerText.trim()) {
                return { text: element.innerText.substring(0, 5000), source: selector };
              }
            }
            return { text: document.body.innerText.substring(0, 5000), source: "all" };
          },
        },
        (injectionResults) => {
          if (chrome.runtime.lastError) {
            console.error("Error extracting page content:", chrome.runtime.lastError.message);
            classifyButton.disabled = false;
            classifyButton.style.backgroundColor = ""; // Reset button
            classifyButton.innerText = "Classify"; // Reset button text
            resultElement.innerText = `Error: ${chrome.runtime.lastError.message}`;
            return;
          }

          const pageData = injectionResults[0].result;

          sourceElement.innerText = `Extracted Text Source: ${pageData.source}`;
          extractedTextElement.style.display = "block"; // Show extracted text
          extractedTextElement.innerText = pageData.text;

          // Send data to background script for classification
          chrome.runtime.sendMessage(
            { action: "classifyPage", content: pageData.text },
            (response) => {
              classifyButton.disabled = false;
              classifyButton.style.backgroundColor = ""; // Reset button
              classifyButton.innerText = "Classify"; // Reset button text

              if (response && response.subject) {
                resultElement.innerHTML = `This page is classified as: <span>${response.subject}</span>`;
                storeClassification(response.subject, tabs[0].url); // Store the classification
              } else {
                resultElement.innerText = "Classification failed.";
              }
            }
          );
        }
      );
    });
  };

  // Add event listener for the "Classify" button
  if (classifyButton) {
    classifyButton.addEventListener("click", classifyPage);
  } else {
    console.error("Classify button not found");
  }

  // Add event listener for the "View Past Classifications" button
  if (viewResponsesButton) {
    viewResponsesButton.addEventListener("click", displayResponses);
  } else {
    console.error("View Past Classifications button not found");
  }
});
