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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

const MessagesPage: React.FC = () => {
  const { data: messages, isLoading } = useQuery('message-logs', async () => {
    const messagesRef = collection(db, 'message_logs');
    const q = query(messagesRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-ZA');
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'broadcast':
        return 'primary';
      case 'test':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Message Logs
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        This page shows all messages sent through the system, including WhatsApp and SMS broadcasts.
        In mock mode, messages are logged here instead of being sent to external services.
      </Typography>

      {messages && messages.length > 0 ? (
        <Box>
          {messages.map((message: any) => (
            <Accordion key={message.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1">
                      {message.messageType === 'broadcast' ? 'Alert Broadcast' : 'Test Message'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(message.timestamp)}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Chip
                      label={message.messageType || 'unknown'}
                      color={getMessageTypeColor(message.messageType) as any}
                      size="small"
                    />
                    <Chip
                      label={message.status || 'unknown'}
                      color={getStatusColor(message.status) as any}
                      size="small"
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="body2" paragraph>
                    <strong>Content:</strong>
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.875rem',
                    }}
                  >
                    {message.content || 'No content'}
                  </Box>
                  
                  {message.recipients && message.recipients.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="body2" paragraph>
                        <strong>Recipients ({message.recipients.length}):</strong>
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {message.recipients.map((recipient: string, index: number) => (
                          <Chip
                            key={index}
                            label={recipient}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {message.alertId && (
                    <Typography variant="body2" color="text.secondary" mt={2}>
                      <strong>Alert ID:</strong> {message.alertId}
                    </Typography>
                  )}

                  {message.sentBy && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Sent by:</strong> {message.sentBy}
                    </Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No messages found. Messages will appear here when alerts are created or test messages are sent.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MessagesPage;