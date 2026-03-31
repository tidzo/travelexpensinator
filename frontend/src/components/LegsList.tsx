import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
} from '@mui/material';
import {
  DirectionsTransit,
  Add,
  Edit,
  Delete,
  TripOrigin,
  FlagOutlined,
} from '@mui/icons-material';
import { Leg, Location } from '../types';
import { api } from '../services/api';

interface LegsListProps {
  journeyId: number;
  locations: Location[];
}

function LegsList({ journeyId, locations }: LegsListProps) {
  const [legs, setLegs] = useState<Leg[]>([]);
  const [loading, setLoading] = useState(true);
  const [legDialogOpen, setLegDialogOpen] = useState(false);
  const [editingLeg, setEditingLeg] = useState<Leg | null>(null);
  const [newLeg, setNewLeg] = useState({
    journey_id: journeyId,
    mode_of_transport: 'TRAIN' as Leg['mode_of_transport'],
    origin_location_id: 0,
    destination_location_id: 0,
    notes: ''
  });

  const loadLegs = async () => {
    try {
      const data = await api.get<Leg[]>(`/legs?journey_id=${journeyId}`);
      setLegs(data);
    } catch (error) {
      console.error('Failed to load legs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLegs();
  }, [journeyId]);

  const handleCreateLeg = async () => {
    try {
      if (editingLeg) {
        const updatedLeg = await api.put<Leg>(`/legs/${editingLeg.id}`, newLeg);
        setLegs(legs.map(leg => leg.id === editingLeg.id ? updatedLeg : leg));
      } else {
        const leg = await api.post<Leg>('/legs', newLeg);
        setLegs([...legs, leg]);
      }
      handleCloseLegDialog();
    } catch (error) {
      console.error('Failed to save leg:', error);
    }
  };

  const handleEditLeg = (leg: Leg) => {
    setEditingLeg(leg);
    setNewLeg({
      journey_id: leg.journey_id,
      mode_of_transport: leg.mode_of_transport,
      origin_location_id: leg.origin_location_id,
      destination_location_id: leg.destination_location_id,
      notes: leg.notes || ''
    });
    setLegDialogOpen(true);
  };

  const handleCloseLegDialog = () => {
    setLegDialogOpen(false);
    setEditingLeg(null);
    setNewLeg({
      journey_id: journeyId,
      mode_of_transport: 'TRAIN',
      origin_location_id: 0,
      destination_location_id: 0,
      notes: ''
    });
  };

  const deleteLeg = async (legId: number) => {
    if (window.confirm('Are you sure you want to delete this transport leg?')) {
      try {
        await api.delete(`/legs/${legId}`);
        setLegs(legs.filter(leg => leg.id !== legId));
      } catch (error) {
        console.error('Failed to delete leg:', error);
      }
    }
  };

  const getTransportIcon = (mode: string) => {
    const icons: Record<string, JSX.Element> = {
      TRAIN: <DirectionsTransit />,
      TUBE: <DirectionsTransit />,
      TAXI: <DirectionsTransit />,
      FLIGHT: <DirectionsTransit />,
      BUS: <DirectionsTransit />,
      WALK: <DirectionsTransit />,
      CAR: <DirectionsTransit />,
      OTHER: <DirectionsTransit />
    };
    return icons[mode] || <DirectionsTransit />;
  };

  const getTransportColor = (mode: string) => {
    const colors: Record<string, string> = {
      TRAIN: 'primary',
      TUBE: 'secondary',
      TAXI: 'warning',
      FLIGHT: 'info',
      BUS: 'success',
      WALK: 'default',
      CAR: 'error',
      OTHER: 'default'
    };
    return colors[mode] || 'default';
  };

  const getLocationName = (locationId: number) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : `Location ${locationId}`;
  };

  if (loading) {
    return <Typography variant="body2">Loading transport legs...</Typography>;
  }

  return (
    <Box>
      {legs.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No transport legs yet. Add your first leg to track your journey.
        </Typography>
      ) : (
        <List disablePadding>
          {legs.map((leg, index) => (
            <Box key={leg.id}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton
                      onClick={() => handleEditLeg(leg)}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => deleteLeg(leg.id)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                }
                sx={{ py: 1 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mr: 2 }}>
                  <TripOrigin sx={{ mr: 2, color: 'action.active' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {getLocationName(leg.origin_location_id)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">→</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {getLocationName(leg.destination_location_id)}
                      </Typography>
                      <Chip
                        icon={getTransportIcon(leg.mode_of_transport)}
                        label={leg.mode_of_transport}
                        size="small"
                        color={getTransportColor(leg.mode_of_transport) as any}
                      />
                    </Box>
                    {leg.notes && (
                      <Typography variant="caption" color="text.secondary">
                        {leg.notes}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </ListItem>
              {index < legs.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}

      <Button
        variant="outlined"
        size="small"
        startIcon={<Add />}
        onClick={() => setLegDialogOpen(true)}
        sx={{ mt: 2 }}
      >
        Add Transport Leg
      </Button>

      <Dialog open={legDialogOpen} onClose={handleCloseLegDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingLeg ? 'Edit Transport Leg' : 'Add New Transport Leg'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth variant="outlined" sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Mode of Transport</InputLabel>
            <Select
              value={newLeg.mode_of_transport}
              onChange={(e) => setNewLeg({ ...newLeg, mode_of_transport: e.target.value as Leg['mode_of_transport'] })}
              label="Mode of Transport"
            >
              <MenuItem value="TRAIN">Train</MenuItem>
              <MenuItem value="TUBE">Tube/Metro</MenuItem>
              <MenuItem value="TAXI">Taxi</MenuItem>
              <MenuItem value="FLIGHT">Flight</MenuItem>
              <MenuItem value="BUS">Bus</MenuItem>
              <MenuItem value="WALK">Walk</MenuItem>
              <MenuItem value="CAR">Car</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>From</InputLabel>
            <Select
              value={newLeg.origin_location_id || ''}
              onChange={(e) => setNewLeg({ ...newLeg, origin_location_id: Number(e.target.value) })}
              label="From"
            >
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name} ({location.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>To</InputLabel>
            <Select
              value={newLeg.destination_location_id || ''}
              onChange={(e) => setNewLeg({ ...newLeg, destination_location_id: Number(e.target.value) })}
              label="To"
            >
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name} ({location.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newLeg.notes}
            onChange={(e) => setNewLeg({ ...newLeg, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLegDialog}>Cancel</Button>
          <Button
            onClick={handleCreateLeg}
            variant="contained"
            disabled={!newLeg.origin_location_id || !newLeg.destination_location_id}
          >
            {editingLeg ? 'Update Leg' : 'Create Leg'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LegsList;