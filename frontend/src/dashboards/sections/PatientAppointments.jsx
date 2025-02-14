import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Search, X } from 'lucide-react';
import patientService from '../../api/patientService';

const RequestAppointmentModal = ({ isOpen, onClose, onAppointmentRequested }) => {
  const [formData, setFormData] = useState({
    doctorId: '',
    date: '',
    time: '',
    type: '',
    notes: ''
  });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await patientService.getDoctors();
        setDoctors(response.data || []);
        
        // Automatically select first doctor if list is not empty
        if (response.data && response.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            doctorId: response.data[0]._id
          }));
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }
    };
    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Comprehensive logging
    console.log('Submitting Appointment Request:', {
      doctorId: formData.doctorId,
      date: formData.date,
      time: formData.time,
      type: formData.type,
      notes: formData.notes
    });

    // Log the selected doctor details
    const selectedDoctor = doctors.find(doc => doc._id === formData.doctorId);
    console.log('Selected Doctor Details:', selectedDoctor);

    setLoading(true);
    try {
      await patientService.requestAppointment({
        doctor: formData.doctorId,
        date: formData.date,
        time: formData.time,
        type: formData.type,
        notes: formData.notes
      });
      
      onAppointmentRequested();
      onClose();
    } catch (error) {
      console.error('Full Error Details:', error);
      setError(error.response?.data?.message || 'Failed to request appointment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Request Appointment</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Doctor</label>
            <select
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              required
            >
              <option value="">Select Doctor</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name} - {doctor.specialization}
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
              min={new Date().toISOString().split('T')[0]}
              required
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
              placeholder="Any specific concerns or symptoms..."
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
              {loading ? 'Requesting...' : 'Request Appointment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
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

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await patientService.getAppointments();
      setAppointments(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await patientService.cancelAppointment(appointmentId);
        fetchAppointments();
      } catch (error) {
        console.error('Error cancelling appointment:', error);
      }
    }
  };

  if (loading) return <div className="p-4">Loading appointments...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Appointments</h2>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          Request Appointment
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
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
                  <td className="px-6 py-4 whitespace-nowrap">Dr. {appointment.doctor?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(appointment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{appointment.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{appointment.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-sm rounded-full ${
                      appointment.status === 'Completed' 
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.status === 'Pending' && (
                      <button
                        onClick={() => handleCancel(appointment._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RequestAppointmentModal 
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onAppointmentRequested={fetchAppointments}
      />
    </div>
  );
};

export default PatientAppointments;