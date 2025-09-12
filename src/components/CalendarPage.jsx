import React from 'react';
import Calendar from 'react-calendar';

const moodColors = { 1: '#ef4444', 2: '#f97316', 3: '#facc15', 4: '#a3e635', 5: '#4ade80' };

const formatDateToKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function CalendarPage({ moodHistory }) {
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateKey = formatDateToKey(date);
      const moodEntry = moodHistory[dateKey];

      if (moodEntry) {
        return (
          <div className="mood-dot-container">
            <div 
              className="mood-dot" 
              style={{ backgroundColor: moodColors[moodEntry.mood] }}
              title={moodEntry.label}
            ></div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="settings-container">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Your Mood Calendar</h3>
          <p className="card-description">A history of your mood entries.</p>
        </div>
        <div className="card-content">
          <Calendar
            tileContent={tileContent}
            className="mood-calendar"
          />
        </div>
      </div>
    </div>
  );
}