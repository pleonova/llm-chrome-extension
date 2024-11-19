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
