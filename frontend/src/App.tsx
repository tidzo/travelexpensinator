import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import TripsList from './pages/TripsList';
import TripDetail from './pages/TripDetail';
import MonthlyReport from './pages/MonthlyReport';
import LocationsList from './pages/LocationsList';
import Navigation from './components/Navigation';
import { DateProvider, useDateContext } from './contexts/DateContext';

function DateSelectors() {
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useDateContext();

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>Month</InputLabel>
        <Select
          value={selectedMonth}
          label="Month"
          onChange={(e) => setSelectedMonth(e.target.value as number)}
          sx={{
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
            '& .MuiSvgIcon-root': { color: 'white' }
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <MenuItem key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString('en-GB', { month: 'long' })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>Year</InputLabel>
        <Select
          value={selectedYear}
          label="Year"
          onChange={(e) => setSelectedYear(e.target.value as number)}
          sx={{
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
            '& .MuiSvgIcon-root': { color: 'white' }
          }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <MenuItem key={i} value={new Date().getFullYear() - 2 + i}>
              {new Date().getFullYear() - 2 + i}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

function AppContent() {
  const location = useLocation();

  // Pages that should show date selectors
  const showDateSelectors = ['/', '/expenses', '/reports'].includes(location.pathname);

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Travel Expense Manager
          </Typography>
          {showDateSelectors && <DateSelectors />}
        </Toolbar>
      </AppBar>

      <Box sx={{
        flex: 1,
        overflow: 'auto',
        pb: 8 // Space for bottom navigation
      }}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Routes>
            <Route path="/" element={<TripsList />} />
            <Route path="/expenses" element={<TripsList />} />
            <Route path="/expenses/trips/:tripId" element={<TripDetail />} />
            <Route path="/locations" element={<LocationsList />} />
            <Route path="/reports" element={<MonthlyReport />} />
          </Routes>
        </Container>
      </Box>

      <Navigation />
    </Box>
  );
}

function App() {
  return (
    <Router>
      <DateProvider>
        <AppContent />
      </DateProvider>
    </Router>
  );
}

export default App;