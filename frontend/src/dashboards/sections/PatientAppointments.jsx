import React, { useState } from 'react';
import { Calendar, Clock, Plus, Search, X } from 'lucide-react';

const PatientAppointments = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Sample appointments data
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      doctor: "Dr. Smith",
      type: "General Checkup",
      date: "2024-01-30",
      time: "10:00 AM",
      status: "upcoming"
    },
    {
      id: 2,
      doctor: "Dr. Wilson",
      type: "Consultation",
      date: "2024-01-15",
      time: "11:00 AM",
      status: "completed"
    }
  ]);

  const [newAppointment, setNewAppointment] = useState({
    doctor: "",
    date: "",
    time: "",
    reason: ""
  });

  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);

  // Handlers
  const handleSubmitAppointment = (e) => {
    e.preventDefault();
    const appointment = {
      id: appointments.length + 1,
      doctor: newAppointment.doctor,
      type: newAppointment.reason,
      date: newAppointment.date,
      time: newAppointment.time,
      status: "upcoming"
    };
    setAppointments([...appointments, appointment]);
    setIsModalOpen(false);
    setNewAppointment({ doctor: "", date: "", time: "", reason: "" });
  };

  const handleCancel = (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      setAppointments(appointments.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: "cancelled" }
          : apt
      ));
    }
  };

  const handleReschedule = (appointment) => {
    setAppointmentToReschedule(appointment);
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    setAppointments(appointments.map(apt => 
      apt.id === appointmentToReschedule.id 
        ? {
            ...apt,
            date: newAppointment.date,
            time: newAppointment.time,
            status: "upcoming"
          }
        : apt
    ));
    setIsRescheduleModalOpen(false);
    setAppointmentToReschedule(null);
    setNewAppointment({ doctor: "", date: "", time: "", reason: "" });
  };

  return (
    <div className="p-6">
      {/* Header with Booking Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Appointments</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          Book Appointment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'upcoming' 
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'past' 
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Past
        </button>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {appointments
            .filter(apt => {
              if (activeTab === 'upcoming') return apt.status === 'upcoming';
              return apt.status === 'completed' || apt.status === 'cancelled';
            })
            .map((appointment) => (
              <div key={appointment.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {appointment.doctor} - {appointment.type}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {appointment.date} - {appointment.time}
                    </p>
                    {appointment.status === 'cancelled' && (
                      <span className="inline-block mt-2 px-2 py-1 text-sm text-red-800 bg-red-100 rounded-full">
                        Cancelled
                      </span>
                    )}
                    {appointment.status === 'completed' && (
                      <span className="inline-block mt-2 px-2 py-1 text-sm text-green-800 bg-green-100 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  {appointment.status === 'upcoming' && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleReschedule(appointment)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Reschedule
                      </button>
                      <button 
                        onClick={() => handleCancel(appointment.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Book Appointment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Doctor</label>
                <select
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAppointment.doctor}
                  onChange={(e) => setNewAppointment({...newAppointment, doctor: e.target.value})}
                  required
                >
                  <option value="">Select Doctor</option>
                  <option value="Dr. Smith">Dr. Smith - General</option>
                  <option value="Dr. Jones">Dr. Jones - Cardiology</option>
                  <option value="Dr. Wilson">Dr. Wilson - Neurology</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <select
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                  required
                >
                  <option value="">Select Time</option>
                  <option value="9:00 AM">9:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="2:00 PM">2:00 PM</option>
                  <option value="3:00 PM">3:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason for Visit</label>
                <textarea
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={newAppointment.reason}
                  onChange={(e) => setNewAppointment({...newAppointment, reason: e.target.value})}
                  required
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Book Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Reschedule Appointment</h3>
              <button onClick={() => setIsRescheduleModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Date</label>
                <input
                  type="date"
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">New Time</label>
                <select
                  className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                  required
                >
                  <option value="">Select Time</option>
                  <option value="9:00 AM">9:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="2:00 PM">2:00 PM</option>
                  <option value="3:00 PM">3:00 PM</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Confirm Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;