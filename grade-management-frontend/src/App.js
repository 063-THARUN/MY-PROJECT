import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [registerNumber, setRegisterNumber] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formNumber, setFormNumber] = useState('');

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

      window.open(`http://localhost:3002/getStudentDetails/${registerNumber}/${semester}/${year}/${section}/${encodeURIComponent(remarks)}/${formNumber}`, '_blank');
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
          
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, mb: 2 }}>
            <TextField
              fullWidth
              label="Register Number"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              placeholder="Enter register number"
            />
            
            <TextField
              fullWidth
              label="Form Number"
              value={formNumber}
              onChange={(e) => setFormNumber(e.target.value)}
              placeholder="Enter form number"
            />
            
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={year}
                label="Year"
                onChange={(e) => setYear(e.target.value)}
              >
                <MenuItem value="I">I</MenuItem>
                <MenuItem value="II">II</MenuItem>
                <MenuItem value="III">III</MenuItem>
                <MenuItem value="IV">IV</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select
                value={section}
                label="Section"
                onChange={(e) => setSection(e.target.value)}
              >
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <FormControl fullWidth>
              <InputLabel>Semester</InputLabel>
              <Select
                value={semester}
                label="Semester"
                onChange={(e) => setSemester(e.target.value)}
              >
                <MenuItem value="I">I</MenuItem>
                <MenuItem value="II">II</MenuItem>
                <MenuItem value="III">III</MenuItem>
                <MenuItem value="IV">IV</MenuItem>
                <MenuItem value="V">V</MenuItem>
                <MenuItem value="VI">VI</MenuItem>
                <MenuItem value="VII">VII</MenuItem>
                <MenuItem value="VIII">VIII</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Purpose"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter certificate purpose"
            />

            <Button 
              variant="contained" 
              onClick={handleSearch}
              disabled={!registerNumber || !semester || !year || !section || !remarks || !formNumber || loading}
              sx={{ height: 'fit-content' }}
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