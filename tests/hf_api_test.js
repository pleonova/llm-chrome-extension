// to run this file: node tests/hf_api_test.js
fetch("https://pleonova-subject-matter.hf.space/predict", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    data: ["The Moon landing is one of the greatest achievements in history."]
  })
})
  .then(response => {
    if (!response.ok) {
      console.error(`API responded with status ${response.status}`);
      return response.text(); // Log raw response for debugging
    }
    return response.json(); // Parse JSON response
  })
  .then(data => console.log("API Response:", data))
  .catch(error => console.error("Error calling API:", error));