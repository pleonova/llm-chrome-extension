chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "classifyPage") {
      const apiUrl = "https://pleonova-subject.hf.space/run/predict";

      fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [message.content] // Send the webpage content to the API
        })
      })
        .then(response => response.json())
        .then(data => {
          if (data && data.data) {
            sendResponse({ subject: data.data[0] }); // API response
          } else {
            sendResponse({ subject: "Unknown" });
          }
        })
        .catch(err => {
          console.error("Error:", err);
          sendResponse({ subject: "Error" });
        });

      return true; // Keep the message channel open for async response
    }
  });
