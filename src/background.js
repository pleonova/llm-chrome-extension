console.log("Background script loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "classifyPage") {
    // Route classification request based on user preference
    if (message.useLocalModel) {
      classifyWithLocalModel(message.content, sendResponse);
    } else {
      classifyWithAPI(message.content, sendResponse);
    }
    return true; // Required for async responses in Chrome extensions
  } else if (message.action === "checkModelAvailability") {
    checkModelAvailability().then(sendResponse);
    return true; // Required for async response
  }
});

async function checkModelAvailability() {
  try {
    const model = await ai.languageModel.create();
    return model != null;
  } catch (error) {
    console.error("Model availability check failed:", error);
    return false;
  }
}

async function classifyWithLocalModel(content, sendResponse) {
  try {
    const systemMessage = `What is the subject of the text below? Pick the best one:
    - Science
    - Math
    - Social Studies
    - Language Arts.
    
    Output Format:
    {
      "label": "subject",
      "explanation": "explanation"
    }
    
    Input Text:
    `;

    // Initialize AI model session with specific parameters
    const session = await ai.languageModel.create({
      systemPrompt: systemMessage,
      temperature: 0.1, // Low temperature for consistent outputs
      topK: 1, // Consider only the most likely response
    });

    // Get classification from the model
    const response = await session.prompt(content);
    console.log('Local model response:', response);

    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(response);
      if (parsedResponse && parsedResponse.label) {
        sendResponse({
          subject: parsedResponse.label,
          explanation: parsedResponse.explanation || null // Include explanation if present
        });
      } else {
        console.error("Invalid response format:", parsedResponse);
        sendResponse({ subject: "Error - Invalid response format" });
      }
    } catch (parseError) {
      console.error("Error parsing model response:", parseError);
      sendResponse({ subject: "Error - Could not parse model response" });
    }
  } catch (error) {
    console.error("Error with local model classification:", error);
    sendResponse({ subject: "Error - Local model classification failed" });
  }
}

async function classifyWithAPI(content, sendResponse) {
  const apiUrl = "https://pleonova-subject-matter.hf.space/predict";

  try {
    // Make POST request to the classification API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [content] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      sendResponse({ subject: "Error - API returned an error" });
      return;
    }

    const data = await response.json();

    // Handle different response scenarios
    if (data && data.label) {
      sendResponse({ subject: data.label });
    } else {
      console.error("Unexpected response format:", data);
      sendResponse({ subject: "Error - Unexpected response from API" });
    }
  } catch (error) {
    console.error("Error calling API:", error);
    sendResponse({ subject: "Error - API call failed" });
  }
}
