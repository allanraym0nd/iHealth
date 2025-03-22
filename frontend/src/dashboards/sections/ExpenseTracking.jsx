import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, X, Calendar, DollarSign } from 'lucide-react';
import billingService from '../../api/billingService';

// Expense Details Modal
const ExpenseDetailsModal = ({ isOpen, onClose, expense }) => {
  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Expense Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Expense Header */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{expense.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium text-red-600">Ksh{expense.amount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Expense Description */}
          {expense.description && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{expense.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
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

// New Expense Modal
const NewExpenseModal = ({ isOpen, onClose, onSubmit }) => {
  const [expenseData, setExpenseData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...expenseData,
      amount: parseFloat(expenseData.amount)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add New Expense</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={expenseData.category}
              onChange={(e) => setExpenseData({...expenseData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select Category</option>
              <option value="Utilities">Utilities</option>
              <option value="Rent">Rent</option>
              <option value="Supplies">Medical Supplies</option>
              <option value="Equipment">Equipment</option>
              <option value="Salaries">Salaries</option>
              <option value="Insurance">Insurance</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={expenseData.amount}
              onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={expenseData.date}
              onChange={(e) => setExpenseData({...expenseData, date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={expenseData.description}
              onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main ExpenseTracking Component
const ExpenseTracking = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  
  // Filtering States
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Fetch Expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true);
        const response = await billingService.getExpenses();
        const expensesData = response.data || response;
        setExpenses(expensesData);
        setFilteredExpenses(expensesData);
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError('Failed to load expenses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // Filter expenses when search or filter changes
  useEffect(() => {
    let result = expenses;

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter(expense => 
        expense.category.toLowerCase() === filterCategory.toLowerCase()
      );
    }

    // Filter by date range
    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate);
      result = result.filter(expense => new Date(expense.date) >= startDate);
    }
    
    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59);
      result = result.filter(expense => new Date(expense.date) <= endDate);
    }

    // Search filter
    if (searchTerm) {
      result = result.filter(expense => 
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExpenses(result);
  }, [filterCategory, searchTerm, dateRange, expenses]);

  // Submit new expense
  const handleAddExpense = async (expenseData) => {
    try {
      const response = await billingService.trackExpense(expenseData);
      setExpenses([...expenses, response.data]);
      setFilteredExpenses([...expenses, response.data]);
      setIsNewExpenseModalOpen(false);
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Failed to add expense');
    }
  };

  if (isLoading) return <div className="p-4">Loading expenses...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Expense Tracking</h2>
        <button 
          onClick={() => setIsNewExpenseModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          Add Expense
        </button>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search expenses..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="utilities">Utilities</option>
            <option value="rent">Rent</option>
            <option value="supplies">Medical Supplies</option>
            <option value="equipment">Equipment</option>
            <option value="salaries">Salaries</option>
            <option value="insurance">Insurance</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center">
            <Calendar size={18} className="mr-2 text-gray-500" />
            <span className="text-sm text-gray-600">Date Range:</span>
          </div>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          />
          <button
            onClick={() => setDateRange({startDate: '', endDate: ''})}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {expense.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {expense.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                    Ksh{expense.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setSelectedExpense(expense)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No expenses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Expense Summary */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-3">Expense Summary</h3>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-xl font-bold text-red-600">
              Ksh{filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Number of Expenses</p>
            <p className="text-xl font-bold text-gray-800">
              {filteredExpenses.length}
            </p>
          </div>
        </div>
      </div>

      {/* Expense Details Modal */}
      <ExpenseDetailsModal 
        isOpen={selectedExpense !== null}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
      />

      {/* New Expense Modal */}
      <NewExpenseModal
        isOpen={isNewExpenseModalOpen}
        onClose={() => setIsNewExpenseModalOpen(false)}
        onSubmit={handleAddExpense}
      />
    </div>
  );
};

export default ExpenseTracking;