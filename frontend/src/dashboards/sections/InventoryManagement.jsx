import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, Archive } from 'lucide-react';
import labService from '../../api/labService';

const AddInventoryItemModal = ({ isOpen, onClose, onItemAdded }) => {
  const [formData, setFormData] = useState({
    item: '',
    quantity: '',
    reorderLevel: '',
    unit: '',
    category: '',
    location: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await labService.addInventoryItem(formData);
      onItemAdded();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add inventory item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add Inventory Item</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Item Name</label>
            <input
              type="text"
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                className="mt-1 w-full p-2 border rounded-lg"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <input
                type="text"
                className="mt-1 w-full p-2 border rounded-lg"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., pcs, boxes"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
            <input
              type="number"
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              <option value="Reagents">Reagents</option>
              <option value="Equipment">Equipment</option>
              <option value="Consumables">Consumables</option>
              <option value="Glassware">Glassware</option>
              <option value="PPE">PPE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Storage Location</label>
            <input
              type="text"
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Room 101, Shelf A"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="mt-1 w-full p-2 border rounded-lg"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm flex items-center">
              <AlertCircle size={16} className="mr-1" />
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
              {loading ? 'Adding...' : 'Add Item'}
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

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showIncomplete, setShowIncomplete] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await labService.getInventory();
      console.log('Inventory data:', response.data);
      setInventory(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await labService.updateInventoryItem(itemId, { quantity: newQuantity });
      fetchInventory();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await labService.deleteInventoryItem(itemId);
        fetchInventory(); // Refresh the list
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  // Filter inventory based on search, category, and completeness
  const filteredInventory = inventory.filter(item => {
    // Filter by search term
    const matchesSearch = 
      (item.item && item.item.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by category
    const matchesCategory = filterCategory === 'all' || 
      (item.category && item.category === filterCategory);

    // Filter by completeness
    const isComplete = item.category && item.location;
    const matchesCompleteness = showIncomplete || isComplete;

    return matchesSearch && matchesCategory && matchesCompleteness;
  });

  if (loading) return <div className="p-4">Loading inventory...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={20} className="mr-2" />
          Add Item
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search inventory..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border rounded-lg"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="Reagents">Reagents</option>
          <option value="Equipment">Equipment</option>
          <option value="Consumables">Consumables</option>
          <option value="Glassware">Glassware</option>
          <option value="PPE">PPE</option>
        </select>
        
        {/* Checkbox to show/hide incomplete records */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showIncomplete"
            checked={showIncomplete}
            onChange={(e) => setShowIncomplete(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="showIncomplete" className="ml-2 text-sm text-gray-700">
            Show incomplete records
          </label>
        </div>
      </div>

      {/* Results counter */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredInventory.length} of {inventory.length} inventory items
        {!showIncomplete && <span> (incomplete records hidden)</span>}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm || filterCategory !== 'all' 
                    ? "No inventory items match your search criteria" 
                    : "No inventory items found"}
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => (
                <tr key={item._id} className={!item.category || !item.location ? "bg-gray-50" : ""}>
                  <td className="px-6 py-4">{item.item}</td>
                  <td className="px-6 py-4">{item.category || <span className="text-red-500">Missing</span>}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        className="w-20 p-1 border rounded"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item._id, e.target.value)}
                      />
                      <span className="text-gray-500">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{item.reorderLevel}</td>
                  <td className="px-6 py-4">{item.location || <span className="text-red-500">Missing</span>}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.quantity <= item.reorderLevel
                        ? 'bg-red-100 text-red-800'
                        : item.quantity <= item.reorderLevel * 1.5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.quantity <= item.reorderLevel
                        ? 'Reorder Required'
                        : item.quantity <= item.reorderLevel * 1.5
                        ? 'Low Stock'
                        : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => alert('Create reorder request')}
                        className={`text-sm ${
                          item.quantity <= item.reorderLevel
                            ? 'text-red-600 hover:text-red-800'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Reorder
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-sm text-red-600 hover:text-red-800 ml-3"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddInventoryItemModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onItemAdded={fetchInventory}
      />
    </div>
  );
};

export default InventoryManagement;