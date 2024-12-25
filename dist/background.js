console.log("Background script loaded");chrome.runtime.onMessage.addListener((e,r,t)=>{if(e.action==="classifyPage")return e.useLocalModel?n(e.content,t):s(e.content,t),!0;if(e.action==="checkModelAvailability")return c().then(t),!0});async function c(){try{return await ai.languageModel.create()==null}catch(e){return console.error("Model availability check failed:",e),!1}}async function n(e,r){try{const a=await(await ai.languageModel.create({systemPrompt:`What is the subject of the text below? Pick the best one:
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
    `,temperature:.1,topK:1})).prompt(e);console.log("Local model response:",a);try{const o=JSON.parse(a);o&&o.label?r({subject:o.label,explanation:o.explanation||null}):(console.error("Invalid response format:",o),r({subject:"Error - Invalid response format"}))}catch(o){console.error("Error parsing model response:",o),r({subject:"Error - Could not parse model response"})}}catch(t){console.error("Error with local model classification:",t),r({subject:"Error - Local model classification failed"})}}async function s(e,r){const t="https://pleonova-subject-matter.hf.space/predict";try{const l=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:[e]})});if(!l.ok){const o=await l.text();console.error("API Error Response:",o),r({subject:"Error - API returned an error"});return}const a=await l.json();a&&a.label?r({subject:a.label}):(console.error("Unexpected response format:",a),r({subject:"Error - Unexpected response from API"}))}catch(l){console.error("Error calling API:",l),r({subject:"Error - API call failed"})}}
