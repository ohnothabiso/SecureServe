import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: alertsData } = useQuery('alerts', async () => {
    const alertsRef = collection(db, 'alerts');
    const q = query(alertsRef, where('active', '==', true), orderBy('createdAt', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

  const { data: usersData } = useQuery('users', async () => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

  const { data: messagesData } = useQuery('messages', async () => {
    const messagesRef = collection(db, 'message_logs');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

  const activeAlerts = alertsData?.length || 0;
  const totalUsers = usersData?.length || 0;
  const recentMessages = messagesData?.length || 0;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'missing_person':
        return 'warning';
      case 'stolen_vehicle':
        return 'error';
      case 'missing_elderly':
        return 'secondary';
      default:
        return 'primary';
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-ZA');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Alerts
                  </Typography>
                  <Typography variant="h4">
                    {activeAlerts}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/alerts')}>
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {totalUsers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/users')}>
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MessageIcon color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Recent Messages
                  </Typography>
                  <Typography variant="h4">
                    {recentMessages}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/messages')}>
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AddIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Typography variant="h6">
                    Create Alert
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/alerts/create')}>
                Create Now
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Alerts
            </Typography>
            {alertsData && alertsData.length > 0 ? (
              <Box>
                {alertsData.map((alert: any) => (
                  <Box key={alert.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6">
                        {alert.title}
                      </Typography>
                      <Chip
                        label={getCategoryLabel(alert.category)}
                        color={getCategoryColor(alert.category) as any}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {alert.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created: {formatDate(alert.createdAt)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">
                No recent alerts
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Messages */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Messages
            </Typography>
            {messagesData && messagesData.length > 0 ? (
              <Box>
                {messagesData.slice(0, 5).map((message: any) => (
                  <Box key={message.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" noWrap>
                      {message.content?.substring(0, 50)}...
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(message.timestamp)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">
                No recent messages
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;