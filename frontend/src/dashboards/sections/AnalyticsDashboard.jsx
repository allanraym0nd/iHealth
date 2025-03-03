import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Users, FileText, Clock } from 'lucide-react';
import receptionService from '../../api/receptionService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AnalyticsDashboard = () => {
  const [period, setPeriod] = useState('day');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await receptionService.getAppointmentAnalytics(period);
      setAnalytics(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert object to array for charts
  const objectToChartData = (obj) => {
    return Object.entries(obj || {}).map(([name, value]) => ({
      name,
      value
    }));
  };

  if (loading) return <div className="p-6">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!analytics) return <div className="p-6">No data available</div>;

  const statusData = objectToChartData(analytics.statusCounts);
  const typeData = objectToChartData(analytics.typeCounts);
  const doctorData = objectToChartData(analytics.doctorCounts);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Appointment Analytics</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setPeriod('day')}
            className={`px-4 py-2 rounded-lg ${
              period === 'day' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg ${
              period === 'week' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg ${
              period === 'month' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <Calendar className="text-blue-500 mr-2" size={24} />
            <h3 className="text-lg font-medium">Total Appointments</h3>
          </div>
          <p className="text-3xl font-bold">{analytics.totalAppointments}</p>
          <div className="mt-2 text-sm">
            <span className="text-green-600">{analytics.completedAppointments} completed</span>
            <span className="mx-2">•</span>
            <span className="text-red-600">{analytics.cancelledAppointments} cancelled</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <Users className="text-green-500 mr-2" size={24} />
            <h3 className="text-lg font-medium">New Patients</h3>
          </div>
          <p className="text-3xl font-bold">{analytics.newPatients}</p>
          <p className="mt-2 text-sm text-gray-500">
            Registered during this period
          </p>
        </div>

        {analytics.averageDuration && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <Clock className="text-purple-500 mr-2" size={24} />
              <h3 className="text-lg font-medium">Average Duration</h3>
            </div>
            <p className="text-3xl font-bold">{Math.round(analytics.averageDuration)} min</p>
            <p className="mt-2 text-sm text-gray-500">
              Per appointment
            </p>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <FileText className="text-yellow-500 mr-2" size={24} />
            <h3 className="text-lg font-medium">Completion Rate</h3>
          </div>
          <p className="text-3xl font-bold">
            {analytics.totalAppointments > 0 
              ? Math.round((analytics.completedAppointments / analytics.totalAppointments) * 100) 
              : 0}%
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Of scheduled appointments
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Appointment Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Appointment Types</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={typeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Doctor Workload */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium mb-4">Doctor Workload</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={doctorData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" name="Appointments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;