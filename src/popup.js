console.log("popup.js loaded successfully");

const GOOGLE_SHEETS_API = {
  SCOPES: ['https://www.googleapis.com/auth/spreadsheets'],
  SHEET_NAME: 'Classification History',
  HEADERS: ['Subject', 'URL', 'Timestamp']
};

// Add this constant at the top with other constants
const STORAGE_KEYS = {
  SPREADSHEET_ID: 'spreadsheetId',
  PREVIOUS_SPREADSHEET_ID: 'previousSpreadsheetId'
};

// Add this function near the top with other utility functions
const getAuthToken = async () => {
  try {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
};

// Add these constants at the top with other constants
const ITEMS_PER_PAGE = 10;
let currentPage = 1;

document.addEventListener("DOMContentLoaded", async () => {
  const classifyButton = document.getElementById("classify");
  const viewResponsesButton = document.getElementById("view-responses");
  const tableBody = document.getElementById("responses-list");
  const responsesTable = document.getElementById("responses-table");

  // Function to store classifications
  const storeClassification = async (subject, url) => {
    const timestamp = new Date().toISOString();
    
    // Store in chrome storage
    chrome.storage.sync.get("responses", (data) => {
      const responses = data.responses || [];
      responses.push({ subject, url, timestamp });
      chrome.storage.sync.set({ responses }, () => {
        console.log("Classification stored in Chrome storage:", { subject, url, timestamp });
      });
    });

    // Also store in Google Sheets if connected
    try {
      const { spreadsheetId } = await chrome.storage.sync.get('spreadsheetId');
      if (spreadsheetId) {
        await appendToGoogleSheet(subject, url, timestamp);
        console.log("Classification stored in Google Sheets");
      }
    } catch (error) {
      console.error("Failed to store in Google Sheets:", error);
    }
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
      const tableBody = document.getElementById("responses-list");
      const responsesTable = document.getElementById("responses-table");
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
        
        // Hide pagination controls
        document.querySelector('.pagination-controls').style.display = 'none';
        
        // Update hexagon visualization
        createHexagonVisualization();
        return;
      }

      // Sort responses by timestamp in descending order (most recent first)
      const sortedResponses = [...responses].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      // Calculate pagination values
      const totalPages = Math.ceil(sortedResponses.length / ITEMS_PER_PAGE);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, sortedResponses.length);

      // Update pagination controls
      const prevButton = document.getElementById('prev-page');
      const nextButton = document.getElementById('next-page');
      const pageInfo = document.getElementById('page-info');

      prevButton.disabled = currentPage === 1;
      nextButton.disabled = currentPage === totalPages;
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
      document.querySelector('.pagination-controls').style.display = 'flex';

      // Display only the items for the current page
      const pageResponses = sortedResponses.slice(startIndex, endIndex);

      pageResponses.forEach((response, index) => {
        const row = document.createElement("tr");

        // Subject Column
        const subjectCell = document.createElement("td");
        subjectCell.textContent = response.subject || "N/A";
        row.appendChild(subjectCell);

        // URL Column
        const urlCell = document.createElement("td");
        const urlLink = document.createElement("a");
        urlLink.href = response.url;
        urlLink.textContent = response.url.length > 50 ? response.url.substring(0, 47) + "..." : response.url;
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
        removeButton.style.padding = "2px 5px";
        removeButton.style.fontSize = "12px";
        removeButton.style.borderRadius = "3px";
        removeButton.addEventListener("click", () => {
          removeClassification(sortedResponses.length - 1 - (startIndex + index));
        });
        removeCell.appendChild(removeButton);
        row.appendChild(removeCell);

        tableBody.appendChild(row);
      });

      responsesTable.style.display = "table";
      createHexagonVisualization();
    });
  };

  // Add event listeners for pagination buttons
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');

  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayResponses();
    }
  });

  nextButton.addEventListener('click', () => {
    chrome.storage.sync.get("responses", (data) => {
      const responses = data.responses || [];
      const totalPages = Math.ceil(responses.length / ITEMS_PER_PAGE);
      if (currentPage < totalPages) {
        currentPage++;
        displayResponses();
      }
    });
  });

  // Shared classification function
  const classifyPageContent = (useLocalModel = false, button) => {
    const resultElement = document.getElementById("result");
    const extractedTextElement = document.getElementById("extracted-text");
    const sourceElement = document.getElementById("source");

    // Update button state
    button.disabled = true;
    button.style.backgroundColor = "#cccccc";
    button.innerText = "Classifying...";

    resultElement.innerText = ""; // Clear previous result
    extractedTextElement.innerText = ""; // Clear previous text
    extractedTextElement.style.display = "none"; // Hide extracted text
    sourceElement.innerText = ""; // Clear source

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found");
        button.disabled = false;
        button.style.backgroundColor = "";
        button.innerText = useLocalModel ? "Classify using Local Model" : "Classify";
        resultElement.innerText = "No active tab found!";
        return;
      }

      const url = new URL(tabs[0].url);

      const scriptOptions = {
        target: { tabId: tabs[0].id },
        func: (hostname) => {
          // Extract tweet text if on Twitter
          if (hostname === "twitter.com" || hostname === "x.com") {
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
        args: [url.hostname]
      };

      chrome.scripting.executeScript(scriptOptions, (injectionResults) => {
        if (chrome.runtime.lastError) {
          console.error("Error:", chrome.runtime.lastError);
          button.disabled = false;
          button.style.backgroundColor = "";
          button.innerText = useLocalModel ? "Classify using Local Model" : "Classify";
          resultElement.innerText = `Error: ${chrome.runtime.lastError.message}`;
          return;
        }

        const pageData = injectionResults[0].result;

        sourceElement.innerText = `Extracted Text Source: ${pageData.source}`;
        extractedTextElement.style.display = "block";
        extractedTextElement.innerText = pageData.text;

        // Send to background script
        chrome.runtime.sendMessage(
          { 
            action: "classifyPage", 
            content: pageData.text,
            useLocalModel 
          },
          (response) => {
            button.disabled = false;
            button.style.backgroundColor = "";
            button.innerText = useLocalModel ? "Classify using Local Model" : "Classify";

            if (response && response.subject) {
              resultElement.innerHTML = `This page is classified as: <span>${response.subject}</span>`;
              storeClassification(response.subject, tabs[0].url); // Store the classification

              // Remove existing explanation element if present
              const existingExplanation = document.getElementById('explanation');
              if (existingExplanation) {
                existingExplanation.remove();
              }

              // Add explanation element only if explanation data is present
              if (response.explanation) {
                const explanationElement = document.createElement('div');
                explanationElement.id = 'explanation';
                explanationElement.innerHTML = `<strong>Explanation:</strong> <em>${response.explanation}</em>`;
                explanationElement.style.marginBottom = '20px'; // Add spacing

                // Insert explanation before the "View Past Classifications" button
                const viewResponsesButton = document.getElementById("view-responses");
                viewResponsesButton.parentNode.insertBefore(explanationElement, viewResponsesButton);
              }
            } else {
              resultElement.innerText = "Classification failed.";
            }
          }
        );
      });
    });
  };

  // Update event listeners
  if (classifyButton) {
    classifyButton.addEventListener("click", () => classifyPageContent(false, classifyButton));
  } else {
    console.error("Classify button not found");
  }

  // Update the event listener for the expander
  const expander = document.getElementById("view-responses");
  if (expander) {
    expander.addEventListener("click", () => {
      const caret = expander.querySelector(".caret");
      const expanderText = expander.querySelector(".expander-text");
      const hexagonViz = document.getElementById("hexagon-visualization");
      const responsesTable = document.getElementById("responses-table");
      const downloadButton = document.getElementById("download-csv");
      
      const isExpanded = caret.classList.contains("expanded");
      
      if (!isExpanded) {
        // Expand
        displayResponses();
        hexagonViz.style.display = "flex";
        responsesTable.style.display = "table";
        caret.classList.add("expanded");
        expanderText.textContent = "Hide Past Classifications";
      } else {
        // Collapse
        hexagonViz.style.display = "none";
        responsesTable.style.display = "none";
        caret.classList.remove("expanded");
        expanderText.textContent = "View Past Classifications";
      }
    });
  } else {
    console.error("Expander not found");
  }

  const classifyLocalButton = document.getElementById("classifyLocalButton");
  if (classifyLocalButton) {
    // Check model availability before enabling button
    chrome.runtime.sendMessage({ action: "checkModelAvailability" }, (isAvailable) => {
      if (!isAvailable) {
        classifyLocalButton.disabled = true;
        classifyLocalButton.style.backgroundColor = "#cccccc";
        classifyLocalButton.innerText = "No local model available";
        classifyLocalButton.style.cursor = "not-allowed";
      } else {
        // Remove any existing background color to match default button styling
        classifyLocalButton.style.backgroundColor = "";
        classifyLocalButton.addEventListener("click", () => classifyPageContent(true, classifyLocalButton));
      }
    });
  } else {
    console.error("Local classification button not found");
  }

  const downloadButton = document.getElementById("download-csv");
  if (downloadButton) {
    downloadButton.addEventListener("click", downloadCSV);
  } else {
    console.error("Download CSV button not found");
  }

  addSpreadsheetManagement();
});

// Function to create the hexagon visualization
const createHexagonVisualization = () => {
  chrome.storage.sync.get("responses", (data) => {
    const responses = data.responses || [];

    // Predefine all subjects with their default counts and colors
    const allSubjects = {
      Mathematics: { count: 0, color: "#F9584B" }, // Red
      Science: { count: 0, color: "#E6B710" }, // Yellow
      "Social Studies": { count: 0, color: "#32B7A9" }, // Teal
      "Language Arts": { count: 0, color: "#4E62E0" }, // Blue
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

// Add new function to create or get spreadsheet ID
const getOrCreateSpreadsheet = async () => {
  const token = await getAuthToken();
  
  // First check if we have a stored spreadsheet ID
  const stored = await chrome.storage.sync.get('spreadsheetId');
  if (stored.spreadsheetId) {
    try {
      // Verify the spreadsheet is still accessible
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${stored.spreadsheetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) return stored.spreadsheetId;
    } catch (error) {
      console.log('Stored spreadsheet no longer accessible, creating new one');
    }
  }

  // Create new spreadsheet
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: 'Web Page Classifications'
      },
      sheets: [{
        properties: {
          title: GOOGLE_SHEETS_API.SHEET_NAME
        }
      }]
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create spreadsheet');
  }

  const { spreadsheetId } = await response.json();
  
  // Initialize the sheet with headers
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${GOOGLE_SHEETS_API.SHEET_NAME}!A1:C1?valueInputOption=RAW`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [GOOGLE_SHEETS_API.HEADERS]
    })
  });

  // Store the spreadsheet ID
  await chrome.storage.sync.set({ spreadsheetId });
  
  return spreadsheetId;
};

// Modify the appendToGoogleSheet function
const appendToGoogleSheet = async (subject, url, timestamp) => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const { spreadsheetId } = await chrome.storage.sync.get('spreadsheetId');
  if (!spreadsheetId) {
    throw new Error('No spreadsheet connected');
  }

  const range = `${GOOGLE_SHEETS_API.SHEET_NAME}!A:C`;
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [[subject, url, new Date(timestamp).toLocaleString()]]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Sheet API Error:', errorData);
    throw new Error('Failed to append to Google Sheet');
  }

  return response.json();
};

// Add UI elements to manage spreadsheet connection
const addSpreadsheetManagement = () => {
  const settingsDiv = document.createElement('div');
  settingsDiv.id = 'sheet-settings';
  settingsDiv.style.marginTop = '20px';
  settingsDiv.style.borderTop = '1px solid #ccc';
  settingsDiv.style.paddingTop = '10px';

  chrome.storage.sync.get('spreadsheetId', async (data) => {
    if (data.spreadsheetId) {
      const token = await getAuthToken();
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}?fields=properties.title`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sheet = await response.json();
      
      settingsDiv.innerHTML = `
        <p>Connected to Sheet: ${sheet.properties.title}</p>
        <button id="disconnect-sheet">Disconnect Sheet</button>
        <button id="open-sheet">Open Sheet</button>
      `;
    } else {
      settingsDiv.innerHTML = `
        <p>No Google Sheet connected</p>
        <button id="connect-sheet" style="background-color: #008000; &:hover { background-color: #006400; }">Connect to Google Sheets (beta)</button>
      `;
    }
  });

  document.body.appendChild(settingsDiv);

  // Add event listeners
  document.addEventListener('click', async (e) => {
    if (e.target.id === 'connect-sheet') {
      try {
        // Try to get previous spreadsheet ID first
        const { previousSpreadsheetId } = await chrome.storage.sync.get(STORAGE_KEYS.PREVIOUS_SPREADSHEET_ID);
        if (previousSpreadsheetId) {
          try {
            // Verify if previous sheet is still accessible
            const token = await getAuthToken();
            const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${previousSpreadsheetId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
              // Previous sheet is accessible, reuse it
              await chrome.storage.sync.set({ 
                [STORAGE_KEYS.SPREADSHEET_ID]: previousSpreadsheetId 
              });
              location.reload();
              return;
            }
          } catch (error) {
            console.log('Previous spreadsheet no longer accessible');
          }
        }
        
        // If no previous sheet or not accessible, create new one
        const spreadsheetId = await getOrCreateSpreadsheet();
        location.reload(); // Refresh the popup to show new state
      } catch (error) {
        console.error('Failed to connect sheet:', error);
      }
    } else if (e.target.id === 'disconnect-sheet') {
      // Store current spreadsheet ID before disconnecting
      const { spreadsheetId } = await chrome.storage.sync.get(STORAGE_KEYS.SPREADSHEET_ID);
      if (spreadsheetId) {
        await chrome.storage.sync.set({ 
          [STORAGE_KEYS.PREVIOUS_SPREADSHEET_ID]: spreadsheetId 
        });
      }
      await chrome.storage.sync.remove(STORAGE_KEYS.SPREADSHEET_ID);
      location.reload();
    } else if (e.target.id === 'open-sheet') {
      const { spreadsheetId } = await chrome.storage.sync.get(STORAGE_KEYS.SPREADSHEET_ID);
      if (spreadsheetId) {
        window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
      }
    }
  });
};

// Function to convert data to CSV format
const convertToCSV = (data) => {
  const headers = ['Subject', 'URL', 'Timestamp'];
  const rows = data.map(item => [
    item.subject,
    item.url,
    new Date(item.timestamp).toLocaleString()
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
};

// Function to trigger CSV download
const downloadCSV = () => {
  chrome.storage.sync.get("responses", (data) => {
    const responses = data.responses || [];
    if (responses.length === 0) {
      alert("No classification history to download.");
      return;
    }

    const csv = convertToCSV(responses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `classification-history-${timestamp}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
};
