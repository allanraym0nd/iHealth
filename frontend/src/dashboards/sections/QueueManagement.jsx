import React, { useState, useEffect } from 'react';
import { Clock, Info } from 'lucide-react';
import receptionService from '../../api/receptionService';

const QueueManagement = () => {
  const [queue, setQueue] = useState([]);
  const [waitingTimes, setWaitingTimes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await receptionService.getCurrentQueue();
      setQueue(response.data);
      
      // Calculate waiting times for appointments in the queue
      calculateWaitingTimes(response.data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching queue:', err);
      setError('Failed to load appointment queue');
    } finally {
      setLoading(false);
    }
  };

  const calculateWaitingTimes = async (appointments) => {
    const waitingTimeData = {};
    
    for (const appointment of appointments) {
      if (appointment.status === 'scheduled' || appointment.status === 'waiting') {
        try {
          const response = await receptionService.getWaitingTimeEstimate(appointment._id);
          waitingTimeData[appointment._id] = response.data;
        } catch (err) {
          console.error(`Failed to get waiting time for appointment ${appointment._id}`, err);
        }
      }
    }
    
    setWaitingTimes(waitingTimeData);
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await receptionService.updateQueueStatus(appointmentId, { status: newStatus });
      fetchQueue(); // Refresh queue after update
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError('Failed to update appointment');
    }
  };

  const formatWaitingTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const formatEstimatedTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6">Loading queue...</div>;
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Appointment Queue</h2>
        <button 
          onClick={fetchQueue}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Refresh Queue
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow">
        {queue.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No appointments in the queue
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {queue.map((appointment) => (
              <div key={appointment._id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">{appointment.patient?.name}</h3>
                      <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getStatusBadgeStyle(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="mr-4">
                        Dr. {appointment.doctor?.name}
                      </span>
                      <span className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {appointment.time}
                      </span>
                      
                      {/* Waiting Time Estimate */}
                      {waitingTimes[appointment._id] && (appointment.status === 'scheduled' || appointment.status === 'waiting') && (
                        <div className="mt-2 flex items-start">
                          <Info size={14} className="mr-1 mt-0.5 text-blue-500" />
                          <div>
                            <p className="text-sm text-blue-700">
                              Estimated wait: {formatWaitingTime(waitingTimes[appointment._id].estimatedWaitingTime)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Estimated start: {formatEstimatedTime(waitingTimes[appointment._id].estimatedStartTime)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {waitingTimes[appointment._id].aheadInQueue} patients ahead in queue
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                    {appointment.status === 'scheduled' && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'waiting')}
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                      >
                        Check-in
                      </button>
                    )}
                    
                    {appointment.status === 'waiting' && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'in-progress')}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        Start
                      </button>
                    )}
                    
                    {appointment.status === 'in-progress' && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Complete
                      </button>
                    )}
                    
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueManagement;