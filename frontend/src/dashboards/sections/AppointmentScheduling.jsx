import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Search, X } from 'lucide-react';
import doctorService from '../../api/doctorService';

// Modal Component 
const AppointmentModal = ({ isOpen, onClose, onAppointmentAdded }) => {
 const [formData, setFormData] = useState({
   patientId: '',
   date: '',
   time: '',
   type: '',
   notes: '',
 });
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [patients, setPatients] = useState([]);

 useEffect(() => {
   // Fetch patients list for dropdown
   const fetchPatients = async () => {
     try {
       const response = await doctorService.getPatients();
       setPatients(response.data || []);
     } catch (error) {
       console.error('Error fetching patients:', error);
     }
   };
   fetchPatients();
 }, []);

 const handleSubmit = async (e) => {
   e.preventDefault();
   setLoading(true);
   setError(null);

   try {
     await doctorService.createAppointment(formData);
     onAppointmentAdded();
     onClose();
   } catch (error) {
     setError(error.response?.data?.message || 'Failed to create appointment');
   } finally {
     setLoading(false);
   }
 };

 if (!isOpen) return null;

 return (
   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
     <div className="bg-white rounded-lg p-6 w-full max-w-md">
       <div className="flex justify-between items-center mb-4">
         <h3 className="text-xl font-bold">Schedule Appointment</h3>
         <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
           <X size={20} />
         </button>
       </div>

       <form onSubmit={handleSubmit} className="space-y-4">
         <div>
           <label className="block text-sm font-medium text-gray-700">Patient</label>
           <select
             className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             value={formData.patientId}
             onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
             required
           >
             <option value="">Select Patient</option>
             {patients.map(patient => (
               <option key={patient._id} value={patient._id}>
                 {patient.name}
               </option>
             ))}
           </select>
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700">Date</label>
           <input
             type="date"
             className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             value={formData.date}
             onChange={(e) => setFormData({ ...formData, date: e.target.value })}
             required
             min={new Date().toISOString().split('T')[0]}
           />
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700">Time</label>
           <input
             type="time"
             className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             value={formData.time}
             onChange={(e) => setFormData({ ...formData, time: e.target.value })}
             required
           />
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700">Type</label>
           <select
             className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             value={formData.type}
             onChange={(e) => setFormData({ ...formData, type: e.target.value })}
             required
           >
             <option value="">Select Type</option>
             <option value="Check-up">Check-up</option>
             <option value="Follow-up">Follow-up</option>
             <option value="Consultation">Consultation</option>
             <option value="Emergency">Emergency</option>
           </select>
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700">Notes</label>
           <textarea
             className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             value={formData.notes}
             onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
             rows="3"
           />
         </div>

         {error && (
           <div className="text-red-500 text-sm">
             {error}
           </div>
         )}

         <div className="flex space-x-2 pt-4">
           <button
             type="submit"
             disabled={loading}
             className={`flex-1 py-2 rounded-lg transition-colors ${
               loading 
                 ? 'bg-blue-300 cursor-not-allowed' 
                 : 'bg-blue-500 hover:bg-blue-600 text-white'
             }`}
           >
             {loading ? 'Scheduling...' : 'Schedule Appointment'}
           </button>
           <button
             type="button"
             onClick={onClose}
             disabled={loading}
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

// Reschedule Modal Component
const RescheduleModal = ({ isOpen, onClose, appointment, onReschedule }) => {
  const [formData, setFormData] = useState({
    date: appointment ? new Date(appointment.date).toISOString().split('T')[0] : '',
    time: appointment ? appointment.time : ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await doctorService.rescheduleAppointment(appointment._id, formData);
      onReschedule();
      onClose();
    } catch (error) {
      console.error('Rescheduling error:', error);
      alert(error.response?.data?.message || 'Failed to reschedule appointment');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Reschedule Appointment</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="mt-1 w-full p-2 border rounded-lg"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              className="mt-1 w-full p-2 border rounded-lg"
              required
            />
          </div>
          <div className="flex space-x-2 pt-4">
            <button 
              type="submit" 
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
            >
              Reschedule
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AppointmentScheduling = () => {
 const [appointments, setAppointments] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
 const [editingAppointment, setEditingAppointment] = useState(null);
 const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState(null);

 useEffect(() => {
   fetchAppointments();
 }, []);

 const fetchAppointments = async () => {
   try {
     setLoading(true);
     const response = await doctorService.getAppointments();
     setAppointments(response.data || []);
     setError(null);
   } catch (err) {
     console.error('Error fetching appointments:', err);
     setError('Failed to load appointments');
   } finally {
     setLoading(false);
   }
 };

 const handleEdit = async (appointmentId) => {
   setEditingAppointment(appointments.find(apt => apt._id === appointmentId));
   setIsModalOpen(true);
 };

 const handleCancel = async (appointmentId) => {
   if (window.confirm('Are you sure you want to cancel this appointment?')) {
     try {
       await doctorService.cancelAppointment(appointmentId);
       fetchAppointments();
     } catch (error) {
       console.error('Error cancelling appointment:', error);
     }
   }
 };

 const handleCompleteAppointment = async (appointmentId) => {
  try {
    const confirmed = window.confirm('Are you sure you want to mark this appointment as completed?');
    
    if (confirmed) {
      setLoading(true);
      await doctorService.completeAppointment(appointmentId);
      
      fetchAppointments();
      
      alert('Appointment marked as completed');
    }
  } catch (error) {
    console.error('Failed to complete appointment:', error);
    
    alert(
      error.response?.data?.message || 
      'Failed to complete appointment. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};

 if (loading) return <div className="p-4">Loading appointments...</div>;
 if (error) return <div className="p-4 text-red-500">{error}</div>;

 return (
   <div className="p-6">
     <div className="flex justify-between items-center mb-6">
       <h2 className="text-2xl font-bold text-gray-800">Appointments</h2>
       <button 
         onClick={() => setIsModalOpen(true)}
         className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
       >
         <Plus size={20} className="mr-2" />
         New Appointment
       </button>
     </div>

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
           {appointments.length === 0 ? (
             <tr>
               <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                 No appointments found
               </td>
             </tr>
           ) : (
             appointments.map((appointment) => (
               <tr key={appointment._id}>
                 <td className="px-6 py-4 whitespace-nowrap">{appointment.patient?.name || 'N/A'}</td>
                 <td className="px-6 py-4 whitespace-nowrap">
                   {new Date(appointment.date).toLocaleDateString()}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap">{appointment.time}</td>
                 <td className="px-6 py-4 whitespace-nowrap">{appointment.type}</td>
                 <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`px-2 py-1 text-sm rounded-full ${
                     appointment.status === 'completed' 
                       ? 'bg-green-100 text-green-800'
                       : 'bg-blue-100 text-blue-800'
                   }`}>
                     {appointment.status}
                   </span>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex space-x-2">
                     <button 
                       onClick={() => handleEdit(appointment._id)}
                       className="text-blue-600 hover:text-blue-900 font-medium" 
                       >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleCancel(appointment._id)}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Cancel
                    </button>
                    {appointment.status === 'scheduled' && (
                      <>
                        <button 
                          onClick={() => handleCompleteAppointment(appointment._id)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Complete
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAppointmentForReschedule(appointment);
                            setIsRescheduleModalOpen(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-900 font-medium"
                        >
                          Reschedule
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    <AppointmentModal 
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
        setEditingAppointment(null);
      }}
      onAppointmentAdded={fetchAppointments}
      appointment={editingAppointment}
    />

    <RescheduleModal
      isOpen={isRescheduleModalOpen}
      onClose={() => {
        setIsRescheduleModalOpen(false);
        setSelectedAppointmentForReschedule(null);
      }}
      appointment={selectedAppointmentForReschedule}
      onReschedule={fetchAppointments}
    />
  </div>
);
};

export default AppointmentScheduling; 