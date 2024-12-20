console.log("Background script loaded");chrome.runtime.onMessage.addListener((o,e,t)=>{if(o.action==="classifyPage")return o.useLocalModel?c(o.content,t):n(o.content,t),!0});async function c(o,e){try{const a=await(await ai.languageModel.create({systemPrompt:`What is the subject of the text below? Pick the best one:
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
    `,temperature:.1,topK:1})).prompt(o);console.log("Local model response:",a);try{const r=JSON.parse(a);r&&r.label?e({subject:r.label,explanation:r.explanation||null}):(console.error("Invalid response format:",r),e({subject:"Error - Invalid response format"}))}catch(r){console.error("Error parsing model response:",r),e({subject:"Error - Could not parse model response"})}}catch(t){console.error("Error with local model classification:",t),e({subject:"Error - Local model classification failed"})}}async function n(o,e){const t="https://pleonova-subject-matter.hf.space/predict";try{const s=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:[o]})});if(!s.ok){const r=await s.text();console.error("API Error Response:",r),e({subject:"Error - API returned an error"});return}const a=await s.json();a&&a.label?e({subject:a.label}):(console.error("Unexpected response format:",a),e({subject:"Error - Unexpected response from API"}))}catch(s){console.error("Error calling API:",s),e({subject:"Error - API call failed"})}}
