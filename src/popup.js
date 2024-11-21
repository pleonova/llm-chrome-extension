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

        // URL Column with Wrapping and Truncation
        const urlCell = document.createElement("td");
        const urlLink = document.createElement("a");
        urlLink.href = response.url;
        urlLink.textContent = response.url.length > 50 ? response.url.substring(0, 47) + "..." : response.url; // Truncate long URLs
        urlLink.title = response.url; // Show full URL on hover
        urlLink.target = "_blank"; // Open in a new tab
        urlCell.appendChild(urlLink);
        urlCell.style.wordWrap = "break-word";
        urlCell.style.maxWidth = "200px"; // Ensure cell doesn't exceed this width
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

  // Add event listener for "Classify" button
  if (classifyButton) {
    classifyButton.addEventListener("click", () => {
      console.log("Classify button clicked");
      // Implement classification logic here
    });
  } else {
    console.error("Classify button not found");
  }

  // Add event listener for "View Past Classifications" button
  if (viewResponsesButton) {
    console.log("View Past Classifications button found");
    viewResponsesButton.addEventListener("click", () => {
      console.log("View Past Classifications button clicked");
      displayResponses();
    });
  } else {
    console.error("View Past Classifications button not found");
  }
});
