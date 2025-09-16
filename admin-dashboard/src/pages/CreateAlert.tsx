import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../services/firebase';
import { AlertCircle, Upload, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface AlertFormData {
  title: string;
  category: 'missing_person' | 'stolen_vehicle' | 'missing_elderly';
  description: string;
  lastSeenLat: string;
  lastSeenLng: string;
  radiusKm: string;
  photo: File | null;
}

export default function CreateAlert() {
  const [formData, setFormData] = useState<AlertFormData>({
    title: '',
    category: 'missing_person',
    description: '',
    lastSeenLat: '',
    lastSeenLng: '',
    radiusKm: '50',
    photo: null,
  });
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const categories = [
    { value: 'missing_person', label: 'Missing Person', emoji: '👶' },
    { value: 'stolen_vehicle', label: 'Stolen Vehicle', emoji: '🚗' },
    { value: 'missing_elderly', label: 'Missing Elderly', emoji: '👴' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const filename = `alerts/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, filename);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const lat = parseFloat(formData.lastSeenLat);
    const lng = parseFloat(formData.lastSeenLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid coordinates');
      return;
    }

    if (lat < -35 || lat > -22 || lng < 16 || lng > 33) {
      toast.error('Coordinates must be within South Africa');
      return;
    }

    const radius = parseInt(formData.radiusKm);
    if (isNaN(radius) || radius < 1 || radius > 200) {
      toast.error('Please enter a valid radius (1-200 km)');
      return;
    }

    setLoading(true);

    try {
      let photoUrl = '';
      if (formData.photo) {
        photoUrl = await uploadPhoto(formData.photo);
      }

      const alertData = {
        alertId: `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        photoUrl,
        lastSeen: {
          lat,
          lng,
        },
        lastSeenAt: serverTimestamp(),
        createdBy: 'admin_user_uid', // This should be the actual admin user UID
        createdAt: serverTimestamp(),
        active: true,
        radiusKm: radius,
        sightingCount: 0,
      };

      await addDoc(collection(firestore, 'alerts'), alertData);

      toast.success('Alert created successfully! Notifications will be sent to users in the area.');
      
      // Reset form
      setFormData({
        title: '',
        category: 'missing_person',
        description: '',
        lastSeenLat: '',
        lastSeenLng: '',
        radiusKm: '50',
        photo: null,
      });
      setPhotoPreview(null);
      
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLocationName = (lat: number, lng: number): string => {
    if (lat >= -26.3 && lat <= -25.7 && lng >= 27.8 && lng <= 28.4) {
      return 'Johannesburg Area';
    } else if (lat >= -25.9 && lat <= -25.6 && lng >= 28.1 && lng <= 28.4) {
      return 'Pretoria Area';
    } else if (lat >= -34.0 && lat <= -33.7 && lng >= 18.3 && lng <= 18.7) {
      return 'Cape Town Area';
    } else if (lat >= -29.9 && lat <= -29.8 && lng >= 30.9 && lng <= 31.1) {
      return 'Durban Area';
    } else {
      return 'Unknown Location';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Alert</h1>
        <p className="text-gray-600">Create a new alert to notify users in the specified area</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Information</h2>
          
          <div className="form-group">
            <label htmlFor="title" className="form-label">Alert Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Missing child - Sipho Nkosi"
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="form-select"
              required
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.emoji} {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Detailed description of the person, vehicle, or situation..."
              rows={4}
              maxLength={500}
              required
            />
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo (Optional)</h2>
          
          <div className="form-group">
            <label htmlFor="photo" className="form-label">Upload Photo</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="photo"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none"
                  >
                    <span>Upload a file</span>
                    <input
                      id="photo"
                      name="photo"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handlePhotoChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </div>

          {photoPreview && (
            <div className="mt-4">
              <img
                src={photoPreview}
                alt="Preview"
                className="max-w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="lastSeenLat" className="form-label">Latitude</label>
              <input
                type="number"
                id="lastSeenLat"
                name="lastSeenLat"
                value={formData.lastSeenLat}
                onChange={handleInputChange}
                className="form-input"
                placeholder="-26.2041"
                step="any"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastSeenLng" className="form-label">Longitude</label>
              <input
                type="number"
                id="lastSeenLng"
                name="lastSeenLng"
                value={formData.lastSeenLng}
                onChange={handleInputChange}
                className="form-input"
                placeholder="28.0473"
                step="any"
                required
              />
            </div>
          </div>

          {formData.lastSeenLat && formData.lastSeenLng && 
           !isNaN(parseFloat(formData.lastSeenLat)) && 
           !isNaN(parseFloat(formData.lastSeenLng)) && (
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm text-blue-700">
                  {getLocationName(parseFloat(formData.lastSeenLat), parseFloat(formData.lastSeenLng))}
                </span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="radiusKm" className="form-label">Notification Radius (km)</label>
            <input
              type="number"
              id="radiusKm"
              name="radiusKm"
              value={formData.radiusKm}
              onChange={handleInputChange}
              className="form-input"
              placeholder="50"
              min="1"
              max="200"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Users within this radius will receive notifications about this alert
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Creating Alert...
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                Create Alert & Send Notifications
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}