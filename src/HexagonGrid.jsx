import React from 'react';

const HexagonGrid = ({ responses }) => {
  // Predefined subjects and their colors
  const allSubjects = {
    Mathematics: { count: 0, color: '#FF6F61' },
    Science: { count: 0, color: '#FFD700' },
    'Social Studies': { count: 0, color: '#40E0D0' },
    'Language Arts': { count: 0, color: '#4682B4' },
  };

  // Update counts based on responses
  responses.forEach((response) => {
    if (allSubjects[response.subject]) {
      allSubjects[response.subject].count += 1;
    }
  });

  return (
    <div id="hexagon-visualization" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
      {Object.entries(allSubjects).map(([subject, { count, color }]) => (
        <div
          key={subject}
          className="hexagon"
          style={{
            backgroundColor: count > 0 ? color : '#ffffff', // White for [0]
            color: count > 0 ? 'white' : 'black',
            width: '100px',
            height: '100px',
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          <div>
            <div>{subject}</div>
            <div>[{count}]</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HexagonGrid;
