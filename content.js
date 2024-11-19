chrome.action.onClicked.addListener(tab => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractContent
  }).catch(error => {
    console.error("Error executing script:", error);
    alert("Failed to extract content. Ensure the extension has the required permissions.");
  });

  function extractContent() {
    const bodyText = document.body.innerText; // Extract text from the webpage
    chrome.runtime.sendMessage({
      action: "classifyPage",
      content: bodyText
    }, response => {
      if (response && response.subject) {
        alert(`This page is classified as: ${response.subject}`);
      } else {
        alert("Classification failed. Try again!");
      }
    });
  }
});
