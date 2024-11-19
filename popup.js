document.getElementById("classify").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => document.body.innerText
      }, results => {
        const pageContent = results[0].result;

        chrome.runtime.sendMessage({
          action: "classifyPage",
          content: pageContent
        }, response => {
          document.getElementById("result").innerText = response.subject
            ? `This page is classified as: ${response.subject}`
            : "Classification failed.";
        });
      });
    });
  });
