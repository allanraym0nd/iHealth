import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import pharmacyService from '../../api/pharmacyService';

// Add/Edit Inventory Item Modal
const InventoryModal = ({ isOpen, onClose, item, onSave }) => {
  const [formData, setFormData] = useState({
    medication: '',
    quantity: '',
    reorderLevel: '',
    expiryDate: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        medication: item.medication || '',
        quantity: item.quantity || '',
        reorderLevel: item.reorderLevel || '',
        expiryDate: item.expiryDate 
          ? new Date(item.expiryDate).toISOString().split('T')[0] 
          : ''
      });
    } else {
      // Reset form when adding new item
      setFormData({
        medication: '',
        quantity: '',
        reorderLevel: '',
        expiryDate: ''
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">
          {item ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Medication Name</label>
            <input
              type="text"
              name="medication"
              value={formData.medication}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
            <input
              type="number"
              name="reorderLevel"
              value={formData.reorderLevel}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div className="flex justify-end space-x-2">
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PharmacyInventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch inventory items
  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      setIsLoading(true);
      const response = await pharmacyService.getInventory();
      
      // Ensure we have an array
      const inventoryData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || []);

      setInventoryItems(inventoryData);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to fetch inventory items');
      setInventoryItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding/editing inventory item
  const handleSaveItem = async (itemData) => {
    try {
      if (selectedItem) {
        // Edit existing item
        await pharmacyService.updateInventoryItem(selectedItem._id, itemData);
      } else {
        // Add new item
        await pharmacyService.addInventoryItem(itemData);
      }
      
      // Refresh inventory
      fetchInventoryItems();
      
      // Close modal
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error saving inventory item:', err);
      setError('Failed to save inventory item');
    }
  };

  // Handle item deletion
  const handleDeleteItem = async (itemId) => {
    try {
      await pharmacyService.deleteInventoryItem(itemId);
      fetchInventoryItems();
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      setError('Failed to delete inventory item');
    }
  };

  // Filter inventory items
  const filteredItems = inventoryItems.filter(item => 
    item.medication.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Identify low stock items
  const lowStockItems = filteredItems.filter(
    item => item.quantity <= item.reorderLevel
  );

  if (isLoading) return <div className="p-4">Loading inventory...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      {/* Header and Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <button
          onClick={() => {
            setSelectedItem(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="mr-2" size={20} />
          Add Item
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <AlertCircle className="text-red-600 mr-2" />
            <h3 className="text-red-800 font-medium">Low Stock Alert</h3>
          </div>
          {lowStockItems.map((item) => (
            <div 
              key={item._id} 
              className="flex justify-between items-center bg-red-100 p-2 rounded mb-2"
            >
              <span className="text-red-800">{item.medication}</span>
              <span className="text-red-600">
                Quantity: {item.quantity} (Reorder Level: {item.reorderLevel})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Items List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No inventory items found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm">
                <th className="py-3 px-4 text-left">Medication</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Reorder Level</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr 
                  key={item._id} 
                  className="border-b hover:bg-gray-50"
                >
                  <td className="py-3 px-4">{item.medication}</td>
                  <td className={`py-3 px-4 text-right ${
                    item.quantity <= item.reorderLevel 
                      ? 'text-red-600 font-bold' 
                      : 'text-gray-800'
                  }`}>
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right">{item.reorderLevel}</td>
                  <td className="py-3 px-4">
                    {item.expiryDate 
                      ? new Date(item.expiryDate).toLocaleDateString() 
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Inventory Item Modal */}
      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onSave={handleSaveItem}
      />
    </div>
  );
};

export default PharmacyInventory;