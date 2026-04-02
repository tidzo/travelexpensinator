import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
} from '@mui/material';
import { EvidenceItem } from '../types';
import { api } from '../services/api';

interface TripEvidenceProps {
  linkEvidenceDialogOpen: boolean;
  onCloseLinkDialog: () => void;
  availableEvidence: EvidenceItem[];
  linkingExpenseId: number | null;
  onEvidenceLinked: () => void;
  evidenceDialogOpen: boolean;
  onCloseEvidenceDialog: () => void;
  selectedExpenseEvidence: EvidenceItem[];
}

function TripEvidence({
  linkEvidenceDialogOpen,
  onCloseLinkDialog,
  availableEvidence,
  linkingExpenseId,
  onEvidenceLinked,
  evidenceDialogOpen,
  onCloseEvidenceDialog,
  selectedExpenseEvidence,
}: TripEvidenceProps) {
  const handleLinkEvidenceToExpense = async (evidenceId: number) => {
    if (!linkingExpenseId) return;

    try {
      await api.post(`/expenses/${linkingExpenseId}/evidence`, {
        evidence_item_id: evidenceId
      });
      onEvidenceLinked();
    } catch (error) {
      console.error('Failed to link evidence:', error);
      alert('Failed to link evidence to expense.');
    }
  };

  return (
    <>
      {/* Link evidence dialog */}
      <Dialog
        open={linkEvidenceDialogOpen}
        onClose={onCloseLinkDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Link Existing Evidence</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select evidence to link to this expense:
          </Typography>
          {availableEvidence.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No available evidence items to link.
            </Typography>
          ) : (
            <List>
              {availableEvidence.map((evidence) => (
                <ListItem
                  key={evidence.id}
                  button
                  onClick={() => handleLinkEvidenceToExpense(evidence.id)}
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}
                >
                  <ListItemText
                    primary={evidence.original_filename}
                    secondary={`Uploaded: ${new Date(evidence.upload_date).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseLinkDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* View evidence dialog */}
      <Dialog
        open={evidenceDialogOpen}
        onClose={onCloseEvidenceDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Evidence Items</DialogTitle>
        <DialogContent>
          {selectedExpenseEvidence.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No evidence items linked to this expense.
            </Typography>
          ) : (
            <List>
              {selectedExpenseEvidence.map((evidence) => (
                <ListItem
                  key={evidence.id}
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}
                >
                  <ListItemText
                    primary={evidence.original_filename}
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          Type: {evidence.file_type}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Uploaded: {new Date(evidence.upload_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseEvidenceDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default TripEvidence;
