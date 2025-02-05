import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Category } from '../types';
import { updateCategory, deleteCategory, reorderCategories } from '../lib/categories';

// Bright and vibrant colors
const PRESET_COLORS = [
  // Bright colors
  '#2563eb', // bright blue
  '#16a34a', // bright green
  '#dc2626', // bright red
  '#9333ea', // bright purple
  '#ea580c', // bright orange
  '#0d9488', // bright teal
  '#4f46e5', // bright indigo
  '#be185d', // bright pink
  '#f59e0b', // bright amber
  '#10b981', // bright emerald
  '#6366f1', // bright violet
  '#ec4899', // bright pink
  // Positive and calming colors
  '#38bdf8', // sky blue
  '#34d399', // emerald green
  '#a78bfa', // soft purple
  '#fbbf24', // warm yellow
  '#fb923c', // soft orange
  '#22d3ee', // cyan
  '#818cf8', // soft indigo
  '#f472b6', // soft pink
];

interface EditCategoryDialogProps {
  category: Category;
  onClose: () => void;
}

export const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({ 
  category,
  onClose
}) => {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCategory(category.id, { name, color });
      window.location.reload();
      onClose();
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(category.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Category</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => setColor(presetColor)}
                    className={`w-8 h-8 rounded-full ${
                      color === presetColor ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: presetColor }}
                  />
                ))}
              </div>
            </div>
            
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-2">Delete Category?</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this category? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};