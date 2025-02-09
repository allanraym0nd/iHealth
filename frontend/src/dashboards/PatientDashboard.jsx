import React, { useState } from 'react';
import { User, Calendar, FileText, Pill, CreditCard, LogOut } from 'lucide-react';
import PatientAppointments from './sections/PatientAppointments';
import PatientMedicalRecords from './sections/PatientMedicalRecords';
import PatientPrescriptions from './sections/PatientPrescriptions';
import PatientBilling from './sections/PatientBilling';



const PatientDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white h-full shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Patient Portal</h2>
          <p className="text-sm text-gray-500">John Doe</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => setActiveSection('dashboard')}
                className={`flex items-center w-full p-2 rounded-lg ${
                  activeSection === 'dashboard' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <User className="mr-3" size={20} />
                <span>Overview</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('appointments')}
                className={`flex items-center w-full p-2 rounded-lg ${
                  activeSection === 'appointments' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Calendar className="mr-3" size={20} />
                <span>Appointments</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('records')}
                className={`flex items-center w-full p-2 rounded-lg ${
                  activeSection === 'records' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <FileText className="mr-3" size={20} />
                <span>Medical Records</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('prescriptions')}
                className={`flex items-center w-full p-2 rounded-lg ${
                  activeSection === 'prescriptions' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Pill className="mr-3" size={20} />
                <span>Prescriptions</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('billing')}
                className={`flex items-center w-full p-2 rounded-lg ${
                  activeSection === 'billing' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <CreditCard className="mr-3" size={20} />
                <span>Billing</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <button className="flex items-center w-full p-2 text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut className="mr-3" size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeSection === 'dashboard' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Overview Cards */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Next Appointment</h3>
                <p className="text-xl font-bold text-gray-800">Jan 30, 2024</p>
                <p className="text-sm text-gray-600">Dr. Smith - Checkup</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Active Prescriptions</h3>
                <p className="text-xl font-bold text-gray-800">3</p>
                <p className="text-sm text-gray-600">2 Refills Available</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Outstanding Balance</h3>
                <p className="text-xl font-bold text-gray-800">$150.00</p>
                <p className="text-sm text-gray-600">Due Feb 15, 2024</p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                    <p className="mt-1">John Doe</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                    <p className="mt-1">January 15, 1985</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1">john.doe@example.com</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="mt-1">(555) 123-4567</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="mt-1">123 Main St, City, State 12345</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Emergency Contact</h3>
                    <p className="mt-1">Jane Doe - (555) 987-6543</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="text-blue-500 mr-3" size={20} />
                    <div>
                      <p className="font-medium">Appointment Scheduled</p>
                      <p className="text-sm text-gray-500">Checkup with Dr. Smith - Jan 30, 2024</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Pill className="text-green-500 mr-3" size={20} />
                    <div>
                      <p className="font-medium">Prescription Refilled</p>
                      <p className="text-sm text-gray-500">Antibiotic - Jan 25, 2024</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="text-red-500 mr-3" size={20} />
                    <div>
                      <p className="font-medium">Payment Processed</p>
                      <p className="text-sm text-gray-500">Lab Tests - $75.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'appointments' && <PatientAppointments />}
        {activeSection === 'records' && <PatientMedicalRecords />}
        {activeSection === 'prescriptions' && <PatientPrescriptions/>}
        {activeSection === 'billing' && <PatientBilling/>}
      </div>
    </div>
  );
};

export default PatientDashboard;