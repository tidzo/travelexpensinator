import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import TripsList from './pages/TripsList';
import ExpensesList from './pages/ExpensesList';
import MonthlyReport from './pages/MonthlyReport';
import LocationsList from './pages/LocationsList';
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Travel Expense Manager
          </Typography>
        </Toolbar>
      </AppBar>

      <Navigation />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<TripsList />} />
          <Route path="/trips" element={<TripsList />} />
          <Route path="/expenses" element={<ExpensesList />} />
          <Route path="/locations" element={<LocationsList />} />
          <Route path="/reports" element={<MonthlyReport />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;