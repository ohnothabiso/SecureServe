import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { AlertCircle, Users, MessageSquare, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface Alert {
  id: string;
  title: string;
  category: string;
  description: string;
  createdAt: any;
  active: boolean;
  sightingCount?: number;
}

interface User {
  id: string;
  displayName: string;
  role: string;
  verified: boolean;
}

interface MessageLog {
  id: string;
  platform: string;
  status: string;
  timestamp: any;
  alertId: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    totalUsers: 0,
    verifiedAdmins: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load alerts
      const alertsQuery = query(
        collection(firestore, 'alerts'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const alertsUnsubscribe = onSnapshot(alertsQuery, (snapshot) => {
        const alerts: Alert[] = [];
        let totalAlerts = 0;
        let activeAlerts = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          alerts.push({
            id: doc.id,
            ...data,
          } as Alert);
          
          totalAlerts++;
          if (data.active) {
            activeAlerts++;
          }
        });
        
        setRecentAlerts(alerts);
        setStats(prev => ({ ...prev, totalAlerts, activeAlerts }));
      });

      // Load users
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      const users: User[] = [];
      let totalUsers = 0;
      let verifiedAdmins = 0;
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          ...data,
        } as User);
        
        totalUsers++;
        if (data.role === 'admin' && data.verified) {
          verifiedAdmins++;
        }
      });
      
      setStats(prev => ({ ...prev, totalUsers, verifiedAdmins }));
      setLoading(false);

      return () => {
        alertsUnsubscribe();
      };
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of AmberSA system status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAlerts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Verified Admins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.verifiedAdmins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
          <a href="/alerts" className="text-red-600 hover:text-red-700 text-sm font-medium">
            View all alerts →
          </a>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
            <p className="mt-1 text-sm text-gray-500">No alerts have been created yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getCategoryIcon(alert.category)}</div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-500">
                      {getCategoryLabel(alert.category)} • {format(alert.createdAt?.toDate(), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    alert.active 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {alert.active ? 'Active' : 'Inactive'}
                  </span>
                  {alert.sightingCount !== undefined && alert.sightingCount > 0 && (
                    <span className="text-sm text-gray-500">
                      {alert.sightingCount} sightings
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href="/alerts/create"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <AlertCircle className="h-5 w-5 mr-2" />
            Create New Alert
          </a>
          <a
            href="/users"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Users className="h-5 w-5 mr-2" />
            Manage Users
          </a>
        </div>
      </div>
    </div>
  );
}