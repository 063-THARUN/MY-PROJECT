import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [registerNumber, setRegisterNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileUpload = async (event) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:3002/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('File uploaded successfully!');
      setFile(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // This will now trigger a PDF download
      window.open(`http://localhost:3002/getStudentDetails/${registerNumber}`, '_blank');
      setSuccess('Grade report generated successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Error fetching student details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Grade Management System
        </Typography>
        
        <Typography variant="h6" align="center" gutterBottom color="primary">
          Velammal College of Engineering and Technology
        </Typography>
        
        <Typography variant="subtitle1" align="center" gutterBottom>
          Department of Computer Science and Engineering
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Upload Excel File
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <TextField
              type="file"
              fullWidth
              onChange={(e) => setFile(e.target.files[0])}
              InputLabelProps={{ shrink: true }}
              inputProps={{ accept: '.xlsx, .xls' }}
            />
            <Button 
              variant="contained" 
              onClick={handleFileUpload}
              disabled={!file || loading}
            >
              Upload
            </Button>
          </Box>

          <Typography variant="h6" gutterBottom>
            Search Student Grades
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Register Number"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              placeholder="Enter register number"
            />
            <Button 
              variant="contained" 
              onClick={handleSearch}
              disabled={!registerNumber || loading}
            >
              Search
            </Button>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default App; 