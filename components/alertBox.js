import React from 'react';

const AlertBox = ({ message, onClose }) => {
  return (
    <div className="fixed top-0 right-0 m-4 p-4 bg-red-500 text-white rounded shadow-lg">
      <div className="flex items-center">
        <span className="flex-grow">{message}</span>
        <button onClick={onClose} className="ml-4 text-xl font-bold">&times;</button>
      </div>
    </div>
  );
};

export default AlertBox;
