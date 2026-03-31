import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Fab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Edit, Delete, LocationOn } from '@mui/icons-material';
import { Location } from '../types';
import { api } from '../services/api';

function LocationsList() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'OTHER' as Location['type'],
    notes: ''
  });

  const loadLocations = async () => {
    try {
      const data = await api.get<Location[]>('/locations');
      setLocations(data);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleCreateLocation = async () => {
    try {
      if (editingLocation) {
        const updatedLocation = await api.put<Location>(`/locations/${editingLocation.id}`, newLocation);
        setLocations(locations.map(location =>
          location.id === editingLocation.id ? updatedLocation : location
        ));
      } else {
        const location = await api.post<Location>('/locations', newLocation);
        setLocations([...locations, location]);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setNewLocation({
      name: location.name,
      type: location.type,
      notes: location.notes || ''
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLocation(null);
    setNewLocation({ name: '', type: 'OTHER', notes: '' });
  };

  const deleteLocation = async (locationId: number) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await api.delete(`/locations/${locationId}`);
        setLocations(locations.filter(location => location.id !== locationId));
      } catch (error) {
        console.error('Failed to delete location:', error);
      }
    }
  };

  const getLocationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      HOME: 'success',
      WORK: 'primary',
      HOTEL: 'secondary',
      STATION: 'warning',
      OTHER: 'default'
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return <Typography>Loading locations...</Typography>;
  }

  return (
    <Box sx={{ pb: 8 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Locations
      </Typography>

      {locations.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary" textAlign="center">
              No locations yet
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Add your first location to get started
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {locations.map((location) => (
            <Card key={location.id} sx={{ mb: 2 }}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEditLocation(location)}
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => deleteLocation(location.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                }
              >
                <LocationOn sx={{ mr: 2, color: 'action.active' }} />
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">
                        {location.name}
                      </Typography>
                      <Chip
                        label={location.type}
                        size="small"
                        color={getLocationTypeColor(location.type) as any}
                      />
                    </Box>
                  }
                  secondary={location.notes && (
                    <Typography variant="body2" color="text.secondary">
                      {location.notes}
                    </Typography>
                  )}
                />
              </ListItem>
            </Card>
          ))}
        </List>
      )}

      <Fab
        color="primary"
        aria-label="add location"
        onClick={() => setDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
        }}
      >
        <Add />
      </Fab>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={newLocation.name}
            onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={newLocation.type}
              onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value as Location['type'] })}
              label="Type"
            >
              <MenuItem value="HOME">Home</MenuItem>
              <MenuItem value="WORK">Work</MenuItem>
              <MenuItem value="HOTEL">Hotel</MenuItem>
              <MenuItem value="STATION">Station</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newLocation.notes}
            onChange={(e) => setNewLocation({ ...newLocation, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleCreateLocation}
            variant="contained"
            disabled={!newLocation.name}
          >
            {editingLocation ? 'Update Location' : 'Create Location'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LocationsList;
