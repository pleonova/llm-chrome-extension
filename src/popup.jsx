console.log('React app is mounting...');
import './popup.jsx';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import HexagonGrid from './HexagonGrid';

const App = () => {
  const [responses, setResponses] = useState([]);

  // Load stored classifications when the component mounts
  useEffect(() => {
    chrome.storage.sync.get('responses', (data) => {
      setResponses(data.responses || []);
    });
  }, []);

  // Function to classify the current page
  const classifyPage = () => {
    console.log('Classify button clicked');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error('No active tab found');
        return;
      }

      const tab = tabs[0];
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => {
            const selectors = ['#mw-content-text', 'main', 'article'];
            for (let selector of selectors) {
              const element = document.querySelector(selector);
              if (element && element.innerText.trim()) {
                return element.innerText.substring(0, 5000);
              }
            }
            return document.body.innerText.substring(0, 5000);
          },
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.error('Error extracting page content:', chrome.runtime.lastError.message);
            return;
          }

          const pageContent = results[0]?.result || '';
          chrome.runtime.sendMessage(
            { action: 'classifyPage', content: pageContent },
            (response) => {
              if (response && response.subject) {
                console.log(`Classified as: ${response.subject}`);
                const newEntry = {
                  subject: response.subject,
                  url: tab.url,
                  timestamp: new Date().toISOString(),
                };

                // Save the new classification to storage
                chrome.storage.sync.get('responses', (data) => {
                  const currentResponses = data.responses || [];
                  currentResponses.push(newEntry);
                  chrome.storage.sync.set({ responses: currentResponses }, () => {
                    setResponses(currentResponses); // Update state
                  });
                });
              } else {
                console.error('Classification failed.');
              }
            }
          );
        }
      );
    });
  };

  // Function to view past classifications
  const viewPastClassifications = () => {
    console.log('View Past Classifications button clicked');
    chrome.storage.sync.get('responses', (data) => {
      setResponses(data.responses || []);
    });
  };

  // Function to remove a classification
  const removeClassification = (index) => {
    chrome.storage.sync.get('responses', (data) => {
      const currentResponses = data.responses || [];
      currentResponses.splice(index, 1); // Remove the selected entry
      chrome.storage.sync.set({ responses: currentResponses }, () => {
        setResponses(currentResponses); // Update state
      });
    });
  };

  return (
    <div>
      <h3>Classify Current Page</h3>
      <button id="classify" onClick={classifyPage}>
        Classify
      </button>
      <button id="view-responses" onClick={viewPastClassifications}>
        View Past Classifications
      </button>
      <table id="responses-table" style={{ marginTop: '20px', width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Subject</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>URL</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Timestamp</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Remove</th>
          </tr>
        </thead>
        <tbody>
          {responses.map((response, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{response.subject}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <a href={response.url} target="_blank" rel="noopener noreferrer">
                  {response.url}
                </a>
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {new Date(response.timestamp).toLocaleString()}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <button
                  style={{
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    cursor: 'pointer',
                  }}
                  onClick={() => removeClassification(index)}
                >
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <HexagonGrid responses={responses} />
    </div>
  );
};

// Render the React app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
