document.addEventListener("DOMContentLoaded", () => {
  const classifyButton = document.getElementById("classify");
  const viewResponsesButton = document.getElementById("view-responses");
  const tableBody = document.getElementById("responses-list");
  const responsesTable = document.getElementById("responses-table");

  const storeClassification = (subject, url) => {
    const timestamp = new Date().toISOString();
    chrome.storage.sync.get("responses", (data) => {
      const responses = data.responses || [];
      responses.push({ subject, url, timestamp });
      chrome.storage.sync.set({ responses }, () => {
        console.log("Classification stored successfully.");
      });
    });
  };

  const displayResponses = () => {
    chrome.storage.sync.get("responses", (data) => {
      const responses = data.responses || [];
      tableBody.innerHTML = ""; // Clear previous entries

      responses.forEach((response) => {
        const row = document.createElement("tr");

        const subjectCell = document.createElement("td");
        subjectCell.textContent = response.subject;
        row.appendChild(subjectCell);

        const urlCell = document.createElement("td");
        const urlLink = document.createElement("a");
        urlLink.href = response.url;
        urlLink.textContent = response.url;
        urlLink.target = "_blank";
        urlCell.appendChild(urlLink);
        row.appendChild(urlCell);

        const timestampCell = document.createElement("td");
        timestampCell.textContent = new Date(response.timestamp).toLocaleString();
        row.appendChild(timestampCell);

        tableBody.appendChild(row);
      });

      responsesTable.style.display = "block";
    });
  };

  if (classifyButton) {
    classifyButton.addEventListener("click", () => {
      const resultElement = document.getElementById("result");
      const extractedTextElement = document.getElementById("extracted-text");
      const sourceElement = document.getElementById("source");

      classifyButton.disabled = true;
      classifyButton.style.backgroundColor = "#cccccc";
      classifyButton.innerText = "Classifying...";
      resultElement.innerText = "";
      extractedTextElement.innerText = "";
      extractedTextElement.style.display = "none";
      sourceElement.innerText = "";

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          classifyButton.disabled = false;
          classifyButton.style.backgroundColor = "";
          classifyButton.innerText = "Classify";
          resultElement.innerText = "No active tab found!";
          return;
        }

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
              classifyButton.disabled = false;
              classifyButton.style.backgroundColor = "";
              classifyButton.innerText = "Classify";
              resultElement.innerText =
                "Error extracting page content: " + chrome.runtime.lastError.message;
              return;
            }

            const pageData = injectionResults[0].result;
            sourceElement.innerText = `Extracted Text Source: ${pageData.source}`;
            extractedTextElement.style.display = "block";
            extractedTextElement.innerText = `${pageData.text}`;

            chrome.runtime.sendMessage(
              { action: "classifyPage", content: pageData.text },
              (response) => {
                classifyButton.disabled = false;
                classifyButton.style.backgroundColor = "";
                classifyButton.innerText = "Classify";

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
    });
  }

  viewResponsesButton.addEventListener("click", displayResponses);
});
