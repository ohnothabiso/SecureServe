import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface MessageLog {
  id: string;
  userId: string;
  phone: string;
  platform: 'whatsapp' | 'sms' | 'both';
  message: string;
  status: 'sent' | 'failed';
  timestamp: any;
  alertId: string;
  error?: string;
}

export default function MessageLogs() {
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed' | 'whatsapp' | 'sms'>('all');

  useEffect(() => {
    const logsQuery = query(
      collection(firestore, 'message_logs'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logs: MessageLog[] = [];
      snapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data(),
        } as MessageLog);
      });
      setMessageLogs(logs);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const filteredLogs = messageLogs.filter(log => {
    switch (filter) {
      case 'sent':
        return log.status === 'sent';
      case 'failed':
        return log.status === 'failed';
      case 'whatsapp':
        return log.platform === 'whatsapp';
      case 'sms':
        return log.platform === 'sms';
      default:
        return true;
    }
  });

  const stats = {
    total: messageLogs.length,
    sent: messageLogs.filter(l => l.status === 'sent').length,
    failed: messageLogs.filter(l => l.status === 'failed').length,
    whatsapp: messageLogs.filter(l => l.platform === 'whatsapp').length,
    sms: messageLogs.filter(l => l.platform === 'sms').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp':
        return '📱';
      case 'sms':
        return '💬';
      case 'both':
        return '📱💬';
      default:
        return '📞';
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
        <h1 className="text-2xl font-bold text-gray-900">Message Logs</h1>
        <p className="text-gray-600">Monitor WhatsApp and SMS message delivery status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📱</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">WhatsApp</p>
              <p className="text-2xl font-bold text-gray-900">{stats.whatsapp}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
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
          onClick={() => setFilter('sent')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'sent'
              ? 'bg-green-100 text-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sent ({stats.sent})
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'failed'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Failed ({stats.failed})
        </button>
        <button
          onClick={() => setFilter('whatsapp')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'whatsapp'
              ? 'bg-green-100 text-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          WhatsApp ({stats.whatsapp})
        </button>
        <button
          onClick={() => setFilter('sms')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'sms'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          SMS ({stats.sms})
        </button>
      </div>

      {/* Message Logs List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="card text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No message logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'No messages have been sent yet.' 
                : `No ${filter} messages found.`
              }
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-xl">{getPlatformIcon(log.platform)}</span>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Alert: {log.alertId}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {log.phone} • {format(log.timestamp?.toDate(), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-md p-3 mb-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {log.message.length > 200 
                        ? `${log.message.substring(0, 200)}...` 
                        : log.message
                      }
                    </p>
                  </div>

                  {log.error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-700">
                        <strong>Error:</strong> {log.error}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(log.status)}
                  <span className={`text-xs font-medium ${
                    log.status === 'sent' 
                      ? 'text-green-700' 
                      : 'text-red-700'
                  }`}>
                    {log.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}