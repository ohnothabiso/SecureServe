import React from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedAlert, setSelectedAlert] = React.useState<any>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { data: alerts, isLoading } = useQuery('all-alerts', async () => {
    const alertsRef = collection(db, 'alerts');
    const q = query(alertsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

  const handleViewAlert = (alert: any) => {
    setSelectedAlert(alert);
    setDialogOpen(true);
  };

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

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Alerts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/alerts/create')}
        >
          Create Alert
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Seen</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts?.map((alert: any) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {alert.title}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getCategoryLabel(alert.category)}
                    color={getCategoryColor(alert.category) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={alert.active ? 'Active' : 'Inactive'}
                    color={alert.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(alert.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(alert.lastSeenAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleViewAlert(alert)}
                  >
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Alert Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Alert Details
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAlert.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedAlert.description}
              </Typography>
              <Box display="flex" gap={2} mb={2}>
                <Chip
                  label={getCategoryLabel(selectedAlert.category)}
                  color={getCategoryColor(selectedAlert.category) as any}
                />
                <Chip
                  label={selectedAlert.active ? 'Active' : 'Inactive'}
                  color={selectedAlert.active ? 'success' : 'default'}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Created:</strong> {formatDate(selectedAlert.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Last Seen:</strong> {formatDate(selectedAlert.lastSeenAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Radius:</strong> {selectedAlert.radiusKm || 50} km
              </Typography>
              {selectedAlert.photoUrl && (
                <Box mt={2}>
                  <img
                    src={selectedAlert.photoUrl}
                    alt="Alert photo"
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertsPage;