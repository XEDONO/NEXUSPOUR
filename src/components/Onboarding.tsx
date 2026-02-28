import React from 'react';

type Props = { onClose: () => void };

const Onboarding: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="bg-white rounded-xl p-6 card z-10 max-w-xl">
        <h2 className="text-xl font-semibold mb-2">Welcome to CafeOps</h2>
        <p className="muted mb-4">This app helps you manage temperatures, stock, and daily checklists. Use the Inventory page to import your stock PDF and the Checklists page to import task lists.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-primary">Get started</button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
