import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Eye } from 'lucide-react';
import patientService from '../../api/patientService';

// Record Details Modal
const RecordModal = ({ isOpen, onClose, record, onDownload }) => {
 if (!isOpen) return null;

 return (
   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
     <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
       <div className="flex justify-between items-center mb-4">
         <h3 className="text-xl font-bold">Medical Record Details</h3>
         <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
       </div>

       <div className="space-y-4">
         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700">Date</label>
             <p className="mt-1">{new Date(record.date).toLocaleDateString()}</p>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700">Doctor</label>
             <p className="mt-1">{record.doctor?.name || 'N/A'}</p>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700">Type</label>
             <p className="mt-1">{record.type || 'General'}</p>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
             <p className="mt-1">{record.diagnosis || 'N/A'}</p>
           </div>
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700">Treatment</label>
           <p className="mt-1">{record.treatment || 'N/A'}</p>
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700">Notes</label>
           <p className="mt-1">{record.notes || 'None'}</p>
         </div>

         <div className="flex justify-end space-x-2 pt-4">
           <button 
             className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
             onClick={() => onDownload(record)}
           >
             <Download size={18} className="mr-2" />
             Download Record
           </button>
           <button
             onClick={onClose}
             className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
           >
             Close
           </button>
         </div>
       </div>
     </div>
   </div>
 );
};

const PatientMedicalRecords = () => {
 const [records, setRecords] = useState([]);
 const [filteredRecords, setFilteredRecords] = useState([]);
 const [selectedRecord, setSelectedRecord] = useState(null);
 const [filterType, setFilterType] = useState('all');
 const [searchTerm, setSearchTerm] = useState('');
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 // Fetch medical records
 useEffect(() => {
   const fetchMedicalRecords = async () => {
     try {
       setLoading(true);
       const response = await patientService.getMedicalRecords();
       
       // Debug logs to see the full record data
       console.log('All medical records:', response.data);
       
       // Log each record's ID and type value to identify what types exist
       if (response.data && response.data.length > 0) {
         console.log('Detailed record types:');
         response.data.forEach(record => {
           console.log(`Record ID: ${record._id}, Type: "${record.type}"`);
         });
       }
       
       setRecords(response.data || []);
       setFilteredRecords(response.data || []);
       setError(null);
     } catch (err) {
       console.error('Error fetching medical records:', err);
       setError('Failed to load medical records');
     } finally {
       setLoading(false);
     }
   };

   fetchMedicalRecords();
 }, []);

 // Filter records - Fixed to handle null/undefined values
 useEffect(() => {
   try {
     let result = [...records];

     // Filter by type - with null checks and handling undefined
     if (filterType !== 'all') {
       result = result.filter(record => {
         // If filtering for General, also include records with undefined type
         if (filterType === 'General' && (record.type === undefined || record.type === null)) {
           return true;
         }
         
         // Normal type comparison for other types
         return record.type && typeof record.type === 'string' && 
           record.type.toLowerCase() === filterType.toLowerCase();
       });
     }

     // Filter by search term - with null checks
     if (searchTerm) {
       result = result.filter(record => 
         (record.diagnosis && typeof record.diagnosis === 'string' && 
          record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
         (record.doctor?.name && typeof record.doctor.name === 'string' && 
          record.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()))
       );
     }

     setFilteredRecords(result);
   } catch (err) {
     console.error('Error filtering records:', err);
     // Fallback to showing all records if filtering fails
     setFilteredRecords(records);
   }
 }, [filterType, searchTerm, records]);

 // Handle download record
 const handleDownloadRecord = (record) => {
   try {
     // Create a text representation of the record
     const recordText = `
MEDICAL RECORD

Date: ${new Date(record.date).toLocaleDateString()}
Doctor: ${record.doctor?.name || 'N/A'}
Type: ${record.type || 'General'}
Diagnosis: ${record.diagnosis || 'N/A'}

Treatment:
${record.treatment || 'N/A'}

Notes:
${record.notes || 'None'}
     `;
     
     // Create blob and download
     const blob = new Blob([recordText], { type: 'text/plain' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `Medical_Record_${new Date(record.date).toISOString().split('T')[0]}.txt`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
   } catch (err) {
     console.error('Error downloading record:', err);
     alert('Failed to download record. Please try again.');
   }
 };

 if (loading) return <div className="p-4">Loading medical records...</div>;
 if (error) return <div className="p-4 text-red-500">{error}</div>;

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
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
         />
       </div>
       <select 
         className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
         value={filterType}
         onChange={(e) => setFilterType(e.target.value)}
       >
         <option value="all">All Types</option>
         <option value="Check-up">Check-ups</option>
         <option value="Emergency">Emergency</option>
         <option value="Surgery">Surgery</option>
         <option value="Follow-up">Follow-up</option>
         <option value="Consultation">Consultation</option>
         <option value="General">General</option>
       </select>
     </div>

     {/* Records List */}
     <div className="bg-white rounded-lg shadow overflow-hidden">
       <div className="divide-y divide-gray-200">
         {filteredRecords.length === 0 ? (
           <div className="p-4 text-center text-gray-500">
             {filterType !== 'all' || searchTerm 
               ? "No medical records match your search criteria" 
               : "No medical records found"}
           </div>
         ) : (
           filteredRecords.map((record) => (
             <div key={record._id} className="p-4 hover:bg-gray-50">
               <div className="flex justify-between items-start">
                 <div>
                   <h3 className="font-medium">{record.type || 'General'}</h3>
                   <p className="text-sm text-gray-500 mt-1">
                     {new Date(record.date).toLocaleDateString()} - {record.doctor?.name || 'N/A'}
                   </p>
                   <p className="text-sm text-gray-600 mt-2">{record.diagnosis || 'N/A'}</p>
                 </div>
                 <div className="flex space-x-2">
                   <button 
                     onClick={() => setSelectedRecord(record)}
                     className="text-blue-600 hover:text-blue-900 font-medium flex items-center"
                   >
                     <Eye size={18} className="mr-1" />
                     View
                   </button>
                   <button 
                     onClick={() => handleDownloadRecord(record)}
                     className="text-green-600 hover:text-green-900 font-medium flex items-center"
                   >
                     <Download size={18} className="mr-1" />
                     Download
                   </button>
                 </div>
               </div>
             </div>
           ))
         )}
       </div>
     </div>

     {/* Record Details Modal */}
     {selectedRecord && (
       <RecordModal 
         isOpen={true}
         onClose={() => setSelectedRecord(null)}
         record={selectedRecord}
         onDownload={handleDownloadRecord}
       />
     )}
   </div>
 );
};

export default PatientMedicalRecords;