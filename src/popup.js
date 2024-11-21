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

  // Function to remove a classification by index
  const removeClassification = (index) => {
    chrome.storage.sync.get("responses", (data) => {
      const responses = data.responses || [];
      if (index >= 0 && index < responses.length) {
        responses.splice(index, 1); // Remove the item at the specified index
        chrome.storage.sync.set({ responses }, () => {
          console.log(`Removed classification at index ${index}`);
          displayResponses(); // Refresh the table
        });
      }
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
        cell.colSpan = 4; // Adjust for the additional "Remove" column
        cell.textContent = "No past classifications found.";
        cell.style.textAlign = "center";
        row.appendChild(cell);
        tableBody.appendChild(row);

        // Update hexagon visualization with no data
        createHexagonVisualization();
        return;
      }

      console.log("Displaying stored responses:", responses);

      responses.forEach((response, index) => {
        const row = document.createElement("tr");

        // Subject Column
        const subjectCell = document.createElement("td");
        subjectCell.textContent = response.subject || "N/A";
        row.appendChild(subjectCell);

        // URL Column
        const urlCell = document.createElement("td");
        const urlLink = document.createElement("a");
        urlLink.href = response.url;
        urlLink.textContent = response.url.length > 50 ? response.url.substring(0, 47) + "..." : response.url; // Truncate long URLs
        urlLink.title = response.url; // Full URL on hover
        urlLink.target = "_blank"; // Open in a new tab
        urlCell.appendChild(urlLink);
        urlCell.style.wordWrap = "break-word";
        urlCell.style.maxWidth = "200px";
        row.appendChild(urlCell);

        // Timestamp Column
        const timestampCell = document.createElement("td");
        timestampCell.textContent = new Date(response.timestamp).toLocaleString();
        row.appendChild(timestampCell);

        // Remove Button Column
        const removeCell = document.createElement("td");
        const removeButton = document.createElement("button");
        removeButton.textContent = "X";
        removeButton.style.color = "white";
        removeButton.style.backgroundColor = "black"; // Change background to black
        removeButton.style.border = "none";
        removeButton.style.cursor = "pointer";
        removeButton.style.padding = "2px 5px"; // Smaller padding for a smaller button
        removeButton.style.fontSize = "12px"; // Smaller font size
        removeButton.style.borderRadius = "3px"; // Optional: Add a slight border radius
        removeButton.addEventListener("click", () => {
          removeClassification(index);
        });
        removeCell.appendChild(removeButton);
        row.appendChild(removeCell);

        tableBody.appendChild(row);
      });

      responsesTable.style.display = "table"; // Show the table

      // Update hexagon visualization
      createHexagonVisualization();
    });
  };

  // Function to handle classification logic
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

      const url = new URL(tabs[0].url);

      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: (hostname) => {
            // Extract tweet text if on Twitter
            if (hostname === "twitter.com") {
              const tweetTextElement = document.querySelector('[data-testid="tweetText"]');
              if (tweetTextElement) {
                return { text: tweetTextElement.innerText, source: "tweet" };
              }
              return { text: "Unable to extract tweet text.", source: "tweet" };
            }

            // General extraction for other sites
            const selectors = ["#mw-content-text", "main", "article"];
            for (let selector of selectors) {
              const element = document.querySelector(selector);
              if (element && element.innerText.trim()) {
                return { text: element.innerText.substring(0, 5000), source: selector };
              }
            }
            return { text: document.body.innerText.substring(0, 5000), source: "all" };
          },
          args: [url.hostname],
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


  // Add event listener for "Classify" button
  if (classifyButton) {
    classifyButton.addEventListener("click", classifyPage);
  } else {
    console.error("Classify button not found");
  }

  // Add event listener for "View Past Classifications" button
  if (viewResponsesButton) {
    viewResponsesButton.addEventListener("click", () => {
      console.log("View Past Classifications button clicked");
      displayResponses();
    });
  } else {
    console.error("View Past Classifications button not found");
  }
});

// Function to create the hexagon visualization
const createHexagonVisualization = () => {
  chrome.storage.sync.get("responses", (data) => {
    const responses = data.responses || [];

    // Predefine all subjects with their default counts and colors
    const allSubjects = {
      Mathematics: { count: 0, color: "#FF6F61" }, // Red
      Science: { count: 0, color: "#FFD700" }, // Yellow
      "Social Studies": { count: 0, color: "#40E0D0" }, // Teal
      "Language Arts": { count: 0, color: "#4682B4" }, // Blue
    };

    // Count the occurrences of each subject
    responses.forEach((response) => {
      if (allSubjects[response.subject]) {
        allSubjects[response.subject].count += 1;
      }
    });

    const hexagonContainer = document.getElementById("hexagon-visualization");
    hexagonContainer.innerHTML = ""; // Clear previous visualization

    // Create hexagons for all subjects
    for (const [subject, { count, color }] of Object.entries(allSubjects)) {
      const hexagon = document.createElement("div");
      hexagon.className = "hexagon";
      hexagon.style.backgroundColor = count > 0 ? color : "#ffffff"; // White if no history
      hexagon.style.color = count > 0 ? "white" : "black"; // Black text for empty subjects
      hexagon.innerHTML = `
        <div class="hexagon-content">
          <p>${subject}</p>
          <p>[${count}]</p>
        </div>
      `;
      hexagonContainer.appendChild(hexagon);
    }
  });
};


