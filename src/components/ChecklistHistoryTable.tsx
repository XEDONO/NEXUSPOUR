import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle } from 'ionicons/icons';

export type TaskRequirement = {
  id: string;
  frequency: string;
  section: string;
  text: string;
  type: 'opening' | 'closing' | 'general';
  completions: Record<string, boolean>;
};

type ChecklistHistoryTableProps = {
  tasks: TaskRequirement[];
  dates: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
};

const ChecklistHistoryTable: React.FC<ChecklistHistoryTableProps> = ({ tasks, dates, frequency }) => {
  const [dailyType, setDailyType] = useState<'opening' | 'closing'>('opening');

  const filteredTasks = tasks.filter(t => {
    if (t.frequency !== frequency) return false;
    if (frequency === 'daily' && t.type !== dailyType) return false;
    return true;
  });

  const sections = Array.from(new Set(filteredTasks.map(t => t.section)));

  return (
    <div className="grid-card loaded">
      {frequency === 'daily' && (
        <div className="m3-selector" style={{ maxWidth: '300px', margin: '0 auto 16px' }}>
          <button className={`type-tab ${dailyType === 'opening' ? 'active' : ''}`} onClick={() => setDailyType('opening')}>Opening</button>
          <button className={`type-tab ${dailyType === 'closing' ? 'active' : ''}`} onClick={() => setDailyType('closing')}>Closing</button>
        </div>
      )}
      <div className="table-viewport">
        <table>
          <thead>
            <tr>
              <th className="sticky-unit">Task</th>
              {dates.map(date => (
                <th key={date}>
                  <div className="header-day-group">
                    <span>{date.split('-')[2]}/{date.split('-')[1]}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map(section => (
              <React.Fragment key={section}>
                <tr>
                  <td colSpan={dates.length + 1} className="sticky-unit" style={{ background: '#f8f5f2' }}>
                    <strong>{section}</strong>
                  </td>
                </tr>
                {filteredTasks.filter(t => t.section === section).map(task => (
                  <tr key={task.id}>
                    <td className="sticky-unit">{task.text}</td>
                    {dates.map(date => (
                      <td key={date} className="completion-cell">
                        {task.completions[date] && <IonIcon icon={checkmarkCircle} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={dates.length + 1} style={{ padding: '60px', opacity: 0.5, textAlign: 'center', fontWeight: 700 }}>
                  No {frequency} checklist records for this window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChecklistHistoryTable;
