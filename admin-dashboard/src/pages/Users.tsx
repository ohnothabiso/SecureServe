import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { Users, Shield, ShieldCheck, User } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  displayName: string;
  phone: string;
  email: string;
  role: 'admin' | 'user';
  verified: boolean;
  lastLocation?: {
    lat: number;
    lng: number;
  };
  fcmTokens: string[];
  createdAt?: any;
  lastLocationUpdated?: any;
}

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admins' | 'users' | 'unverified'>('all');

  useEffect(() => {
    const usersQuery = collection(firestore, 'users');

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData: UserData[] = [];
      snapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data(),
        } as UserData);
      });
      setUsers(usersData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleToggleVerification = async (userId: string, currentVerified: boolean) => {
    try {
      await updateDoc(doc(firestore, 'users', userId), {
        verified: !currentVerified,
      });
      toast.success(`User ${!currentVerified ? 'verified' : 'unverified'} successfully`);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(firestore, 'users', userId), {
        role: newRole,
      });
      toast.success(`User role changed to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const getLocationName = (location?: { lat: number; lng: number }) => {
    if (!location) return 'Unknown';
    
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

  const filteredUsers = users.filter(user => {
    switch (filter) {
      case 'admins':
        return user.role === 'admin';
      case 'users':
        return user.role === 'user';
      case 'unverified':
        return !user.verified;
      default:
        return true;
    }
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    users: users.filter(u => u.role === 'user').length,
    verified: users.filter(u => u.verified).length,
    unverified: users.filter(u => !u.verified).length,
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
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600">Manage user accounts and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Regular Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldCheck className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Verified</p>
              <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('admins')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'admins'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Admins ({stats.admins})
        </button>
        <button
          onClick={() => setFilter('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'users'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Users ({stats.users})
        </button>
        <button
          onClick={() => setFilter('unverified')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'unverified'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Unverified ({stats.unverified})
        </button>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'No users have been registered yet.' 
                : `No ${filter} users found.`
              }
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-700">
                        {user.displayName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.displayName}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-sm text-gray-500">{user.phone}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.verified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.verified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleRole(user.id, user.role)}
                    className={`text-xs px-3 py-1 rounded-md font-medium ${
                      user.role === 'admin'
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    Make {user.role === 'admin' ? 'User' : 'Admin'}
                  </button>
                  
                  <button
                    onClick={() => handleToggleVerification(user.id, user.verified)}
                    className={`text-xs px-3 py-1 rounded-md font-medium ${
                      user.verified
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {user.verified ? 'Unverify' : 'Verify'}
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-sm text-gray-900">
                      {getLocationName(user.lastLocation)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">FCM Tokens</p>
                    <p className="text-sm text-gray-900">
                      {user.fcmTokens?.length || 0} active
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Location Update</p>
                    <p className="text-sm text-gray-900">
                      {user.lastLocationUpdated 
                        ? format(user.lastLocationUpdated.toDate(), 'MMM d, h:mm a')
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}