import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { AlertCircle, Eye, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Alert {
  id: string;
  title: string;
  category: string;
  description: string;
  photoUrl?: string;
  lastSeen: { lat: number; lng: number };
  lastSeenAt: any;
  createdAt: any;
  createdBy: string;
  active: boolean;
  radiusKm: number;
  sightingCount?: number;
  lastSightingAt?: any;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const alertsQuery = query(
      collection(firestore, 'alerts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alertsData: Alert[] = [];
      snapshot.forEach((doc) => {
        alertsData.push({
          id: doc.id,
          ...doc.data(),
        } as Alert);
      });
      setAlerts(alertsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleToggleActive = async (alertId: string, currentActive: boolean) => {
    try {
      await updateDoc(doc(firestore, 'alerts', alertId), {
        active: !currentActive,
      });
      toast.success(`Alert ${!currentActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating alert:', error);
      toast.error('Failed to update alert');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'missing_person':
        return '👶';
      case 'stolen_vehicle':
        return '🚗';
      case 'missing_elderly':
        return '👴';
      default:
        return '🚨';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'missing_person':
        return 'Missing Person';
      case 'stolen_vehicle':
        return 'Stolen Vehicle';
      case 'missing_elderly':
        return 'Missing Elderly';
      default:
        return 'Alert';
    }
  };

  const getLocationName = (location: { lat: number; lng: number }) => {
    const { lat, lng } = location;
    
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

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return alert.active;
    if (filter === 'inactive') return !alert.active;
    return true;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600">Manage and monitor all alerts</p>
        </div>
        <a
          href="/alerts/create"
          className="btn btn-primary"
        >
          <AlertCircle className="h-4 w-4" />
          Create Alert
        </a>
      </div>

      {/* Filter */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'active'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active ({alerts.filter(a => a.active).length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'inactive'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Inactive ({alerts.filter(a => !a.active).length})
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="card text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'No alerts have been created yet.' 
                : `No ${filter} alerts found.`
              }
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div key={alert.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getCategoryIcon(alert.category)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                      <p className="text-sm text-gray-500">
                        {getCategoryLabel(alert.category)} • {format(alert.createdAt?.toDate(), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{alert.description}</p>

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {getLocationName(alert.lastSeen)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Last seen: {format(alert.lastSeenAt?.toDate(), 'MMM d, h:mm a')}
                    </div>
                    <div>
                      Radius: {alert.radiusKm}km
                    </div>
                    {alert.sightingCount !== undefined && alert.sightingCount > 0 && (
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {alert.sightingCount} sightings
                      </div>
                    )}
                  </div>

                  {alert.lastSightingAt && (
                    <div className="mt-2 text-sm text-gray-500">
                      Last sighting: {format(alert.lastSightingAt?.toDate(), 'MMM d, h:mm a')}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    alert.active 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {alert.active ? 'Active' : 'Inactive'}
                  </span>
                  
                  <button
                    onClick={() => handleToggleActive(alert.id, alert.active)}
                    className={`text-xs px-3 py-1 rounded-md font-medium ${
                      alert.active
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {alert.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}