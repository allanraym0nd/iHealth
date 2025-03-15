// components/DashboardHeader.jsx
import React, { useEffect, useState } from 'react';

const DashboardHeader = ({ portalName }) => {
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    // Get username from localStorage when component mounts
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);
  
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">
          {userName ? `${userName}'s ${portalName}` : portalName}
        </h1>
        {/* Add other header elements here (profile dropdown, notifications, etc.) */}
      </div>
    </div>
  );
};

export default DashboardHeader;