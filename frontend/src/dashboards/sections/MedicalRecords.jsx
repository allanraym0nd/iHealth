import React, { useState } from 'react';
import { FileText, Search, Filter, Download, Eye } from 'lucide-react';

const MedicalRecords = () => {
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleViewRecord = (recordId) => {
    // In real app, fetch record details
    setSelectedRecord({
      id: recordId,
      patientName: "John Doe",
      date: "2024-01-28",
      type: "Check-up",
      diagnosis: "Common Cold",
      prescription: "Antibiotics",
      notes: "Patient reported fever and cough..."
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Medical Records</h2>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search records..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Types</option>
          <option value="check-up">Check-ups</option>
          <option value="emergency">Emergency</option>
          <option value="surgery">Surgery</option>
        </select>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">John Doe</td>
              <td className="px-6 py-4 whitespace-nowrap">Jan 28, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap">Check-up</td>
              <td className="px-6 py-4 whitespace-nowrap">Common Cold</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleViewRecord(1)}
                    className="text-blue-600 hover:text-blue-900 font-medium flex items-center"
                  >
                    <Eye size={18} className="mr-1" />
                    View
                  </button>
                  <button className="text-green-600 hover:text-green-900 font-medium flex items-center">
                    <Download size={18} className="mr-1" />
                    Download
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Medical Record Details</h3>
              <button 
                onClick={() => setSelectedRecord(null)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <Eye size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                  <p className="mt-1">{selectedRecord.patientName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="mt-1">{selectedRecord.date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1">{selectedRecord.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                  <p className="mt-1">{selectedRecord.diagnosis}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Prescription</label>
                <p className="mt-1">{selectedRecord.prescription}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1">{selectedRecord.notes}</p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;