export function getPackingStartDate(status) {
  // Returns the packing start date if status indicates packing has begun
  if (status === 'Packing') return new Date().toISOString().split('T')[0];
  return null;
}

export function getPackingEndDate(status) {
  // Returns the packing end date if status indicates packing is completed
  if (status === 'Packed') return new Date().toISOString().split('T')[0];
  return null;
}

export function canOverridePackingDate(role) {
  // Only Admin and Supervisor can manually override dates
  return role === 'Admin' || role === 'Supervisor';
}

export function validatePackingTransition(oldStatus, newStatus) {
  // Define allowed transitions and required date changes
  const allowed = {
    'Not Started': ['Packing'],
    'Packing': ['Packed', 'Not Started'],
    'Packed': ['Packing']
  };
  return allowed[oldStatus] && allowed[oldStatus].includes(newStatus);
}

export function getPackingDateUpdates(prevStatus, nextStatus, role) {
  // Compute date fields to update based on status transition and role permissions
  const updates = {};
  const today = new Date().toISOString().split('T')[0];
  if (!validatePackingTransition(prevStatus, nextStatus)) return updates;
  // Transition logic per business rules
  if (prevStatus === 'Not Started' && nextStatus === 'Packing') {
    updates.packing_start_date = today;
  }
  if (prevStatus === 'Packing' && nextStatus === 'Packed') {
    updates.packing_end_date = today;
  }
  if (prevStatus === 'Packing' && nextStatus === 'Not Started') {
    updates.packing_start_date = null;
    updates.packing_end_date = null;
  }
  if (prevStatus === 'Packed' && nextStatus === 'Packing') {
    updates.packing_end_date = null;
  }
  // Manual override handled elsewhere based on role
  return updates;
}
