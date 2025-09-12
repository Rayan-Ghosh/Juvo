import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Smile, Meh, Frown } from 'lucide-react';

const formatDateToKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const resources = [
    { title: 'Breathing Exercises for Calm', description: 'Simple techniques to find your center during stressful times.', link: 'https://www.healthline.com/health/breathing-exercises-for-anxiety' },
    { title: 'Managing Exam Anxiety', description: 'Tips and strategies to handle pressure before and during exams.', link: 'https://www.princetonreview.com/college-advice/test-anxiety' },
    { title: 'Peer Support Group Resources', description: 'Learn about and find peer support from Mental Health America.', link: 'https://www.mhanational.org/peer-support' },
];
const moodOptions = [
    { level: 5, label: 'Happy', icon: <Smile className="mood-icon happy" /> },
    { level: 4, label: 'Good', icon: <Smile className="mood-icon good" /> },
    { level: 3, label: 'Okay', icon: <Meh className="mood-icon okay" /> },
    { level: 2, label: 'Stressed', icon: <Frown className="mood-icon stressed" /> },
    { level: 1, label: 'Anxious', icon: <Frown className="mood-icon anxious" /> },
];
const moodColors = { 1: '#ef4444', 2: '#f97316', 3: '#facc15', 4: '#a3e635', 5: '#4ade80', 0: '#1f2937' };

export default function Dashboard({ chartData, handleMoodSelect }) {
    const [moodToday, setMoodToday] = useState(null);
    const [activeIndex, setActiveIndex] = useState(null);

    useEffect(() => {
      const todayKey = formatDateToKey(new Date());
      const todayEntry = chartData.find(entry => entry.dateKey === todayKey && entry.mood > 0);
      if (todayEntry) {
        const fullMoodObject = moodOptions.find(opt => opt.level === todayEntry.mood);
        if (fullMoodObject) {
          setMoodToday(fullMoodObject);
        }
      }
    }, [chartData]);

    const handleMouseEnter = (data, index) => setActiveIndex(index);
    const handleMouseLeave = () => setActiveIndex(null);

    const onMoodClick = (selectedMood) => {
        setMoodToday(selectedMood);
        handleMoodSelect(selectedMood);
    };

    return (
        <div className="dashboard-container">
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">How are you feeling today?</h3>
                    <p className="card-description">Your daily check-in helps us understand your well-being.</p>
                </div>
                <div className="card-content">
                    {moodToday ? (
                        <div className="mood-confirmation">
                            <p>Thanks for checking in! You're feeling:</p>
                            <p className="mood-label">{moodToday.label}</p>
                        </div>
                    ) : (
                        <div className="mood-options">
                            {moodOptions.map(mood => (
                                <button key={mood.level} onClick={() => onMoodClick(mood)} className="button mood-button" title={mood.label}>
                                    {mood.icon}
                                    <span>{mood.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="dashboard-grid">
                <div className="card chart-card">
                    <div className="card-header">
                        <h3 className="card-title">Your Weekly Mood Journey</h3>
                        <p className="card-description">Visualizing your mood patterns from the last 7 days.</p>
                    </div>
                    <div className="card-content chart-content">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={chartData} 
                                margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                                onMouseMove={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="day" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--muted)" fontSize={12} domain={[0, 5]} tickCount={6} tickFormatter={(value) => moodOptions.find(m => m.level === value)?.label || ''} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: 'var(--panel-secondary)', 
                                        border: '1px solid var(--border)', 
                                        borderRadius: 'var(--radius)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                    labelStyle={{ color: 'var(--text)', fontWeight: '600' }}
                                    formatter={(value, name, props) => [props.payload.label, 'Mood']}
                                    cursor={{ fill: 'rgba(154, 164, 178, 0.1)' }}
                                />
                                <Bar dataKey="mood" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={moodColors[entry.mood]} 
                                            stroke="none"
                                            style={{
                                                transition: 'all 0.2s ease-in-out',
                                                opacity: activeIndex === null || activeIndex === index ? 1 : 0.6,
                                                filter: activeIndex === index ? 'brightness(1.15)' : 'brightness(1)',
                                            }}
                                        />
                                    ))}
                                 </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Helpful Resources</h3>
                        <p className="card-description">Tools and articles to support you.</p>
                    </div>
                    <div className="card-content resource-list">
                        {resources.map(resource => (
                            <a 
                                href={resource.link} 
                                key={resource.title} 
                                className="resource-item"
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                <h4>{resource.title}</h4>
                                <p>{resource.description}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
