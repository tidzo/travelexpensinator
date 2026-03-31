import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { FlightTakeoff, Receipt, Assessment } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(location.pathname);

  const handleNavigation = (newValue: string) => {
    setValue(newValue);
    navigate(newValue);
  };

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      <BottomNavigation
        value={value}
        onChange={(_event, newValue) => handleNavigation(newValue)}
      >
        <BottomNavigationAction
          label="Trips"
          value="/trips"
          icon={<FlightTakeoff />}
        />
        <BottomNavigationAction
          label="Expenses"
          value="/expenses"
          icon={<Receipt />}
        />
        <BottomNavigationAction
          label="Reports"
          value="/reports"
          icon={<Assessment />}
        />
      </BottomNavigation>
    </Paper>
  );
}

export default Navigation;