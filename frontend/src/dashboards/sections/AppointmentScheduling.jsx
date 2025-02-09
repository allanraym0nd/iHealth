import React, { useState } from 'react';
import { Calendar, Clock, Plus, Search, X } from 'lucide-react';

// Modal Component
const AppointmentModal = ({ isOpen, onClose, appointment }) => {
 if (!isOpen) return null;

 return (
   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
     <div className="bg-white rounded-lg p-6 w-full max-w-md">
       <div className="flex justify-between items-center mb-4">
         <h3 className="text-xl font-bold">Edit Appointment</h3>
         <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
           <X size={20} />
         </button>
       </div>

       <form className="space-y-4">
         <div>
           <label className="block text-sm font-medium text-gray-700">Patient Name</label>
           <input
             type="text"
             className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             defaultValue={appointment?.patientName}
           />
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700">Date</label>
           <input
             type="date"
             className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             defaultValue={appointment?.date}
           />
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700">Time</label>
           <input
             type="time"
             className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             defaultValue={appointment?.time}
           />
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700">Type</label>
           <select className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
             <option value="check-up">Check-up</option>
             <option value="follow-up">Follow-up</option>
             <option value="consultation">Consultation</option>
             <option value="emergency">Emergency</option>
           </select>
         </div>

         <div className="flex space-x-2 pt-4">
           <button
             type="submit"
             className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
           >
             Save Changes
           </button>
           <button
             type="button"
             onClick={onClose}
             className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
           >
             Cancel
           </button>
         </div>
       </form>
     </div>
   </div>
 );
};

// Main Component
const AppointmentScheduling = () => {
 const [editingAppointment, setEditingAppointment] = useState(null);
 const [isModalOpen, setIsModalOpen] = useState(false);

 const handleEdit = (appointmentId) => {
   setEditingAppointment({
     id: appointmentId,
     patientName: "John Doe",
     date: "2024-01-28",
     time: "10:00",
     type: "check-up"
   });
   setIsModalOpen(true);
 };

 const handleCancel = (appointmentId) => {
   if (window.confirm('Are you sure you want to cancel this appointment?')) {
     console.log('Cancelling appointment:', appointmentId);
   }
 };

 return (
   <div className="p-6">
     {/* Header */}
     <div className="flex justify-between items-center mb-6">
       <h2 className="text-2xl font-bold text-gray-800">Appointments</h2>
       <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
         <Plus size={20} className="mr-2" />
         New Appointment
       </button>
     </div>

     {/* Search and Filter */}
     <div className="flex gap-4 mb-6">
       <div className="flex-1 relative">
         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
         <input
           type="text"
           placeholder="Search appointments..."
           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
         />
       </div>
       <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
         <option value="all">All Status</option>
         <option value="scheduled">Scheduled</option>
         <option value="completed">Completed</option>
         <option value="cancelled">Cancelled</option>
       </select>
     </div>

     {/* Appointments Table */}
     <div className="bg-white rounded-lg shadow overflow-hidden">
       <table className="w-full">
         <thead className="bg-gray-50">
           <tr>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
           </tr>
         </thead>
         <tbody className="bg-white divide-y divide-gray-200">
           <tr>
             <td className="px-6 py-4 whitespace-nowrap">John Doe</td>
             <td className="px-6 py-4 whitespace-nowrap">Jan 28, 2024</td>
             <td className="px-6 py-4 whitespace-nowrap">10:00 AM</td>
             <td className="px-6 py-4 whitespace-nowrap">Check-up</td>
             <td className="px-6 py-4 whitespace-nowrap">
               <span className="px-2 py-1 text-sm text-green-800 bg-green-100 rounded-full">Scheduled</span>
             </td>
             <td className="px-6 py-4 whitespace-nowrap">
               <div className="flex space-x-2">
                 <button 
                   onClick={() => handleEdit(1)} 
                   className="text-blue-600 hover:text-blue-900 font-medium"
                 >
                   Edit
                 </button>
                 <button 
                   onClick={() => handleCancel(1)} 
                   className="text-red-600 hover:text-red-900 font-medium"
                 >
                   Cancel
                 </button>
               </div>
             </td>
           </tr>
         </tbody>
       </table>
     </div>

     {/* Edit Modal */}
     <AppointmentModal 
       isOpen={isModalOpen}
       onClose={() => setIsModalOpen(false)}
       appointment={editingAppointment}
     />
   </div>
 );
};

export default AppointmentScheduling;