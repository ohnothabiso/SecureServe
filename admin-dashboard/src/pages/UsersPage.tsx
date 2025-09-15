import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useQuery } from 'react-query';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const UsersPage: React.FC = () => {
  const { data: users, isLoading, refetch } = useQuery('all-users', async () => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

  const handleToggleVerification = async (userId: string, currentVerified: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        verified: !currentVerified,
        lastUpdated: new Date(),
      });
      refetch();
    } catch (error) {
      console.error('Error updating user verification:', error);
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
      <Typography variant="h4" gutterBottom>
        Users
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Verified</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users?.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {user.displayName || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.email || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.phone || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.role || 'user'}
                    color={user.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={user.verified || false}
                        onChange={() => handleToggleVerification(user.id, user.verified || false)}
                        disabled={user.role === 'admin'} // Don't allow changing admin verification
                      />
                    }
                    label={user.verified ? 'Verified' : 'Unverified'}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(user.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(user.lastUpdated)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UsersPage;