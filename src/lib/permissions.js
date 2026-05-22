export function getPermissions(role) {
  const isAdmin         = role === 'Admin';
  const isSupervisor    = role === 'Supervisor';
  const isUser          = role === 'User';
  const isDashboardUser = role === 'Dashboard User';
  const isSecurityUser  = role === 'Security';

  return {
    isAdmin,
    isSupervisor,
    isUser,
    isDashboardUser,
    isSecurityUser,

    canCreateWO:         isAdmin || isSupervisor || isUser,
    canEditWO:           isAdmin || isSupervisor,
    canDeleteWO:         isAdmin || isSupervisor,
    canAddPacking:       isAdmin || isSupervisor || isUser,
    canEditPackingDates: isAdmin || isSupervisor,
    canAddPackingDates:  isAdmin || isSupervisor || isUser,
    canEditPacking:      isAdmin || isSupervisor,
    canDeletePacking:    isAdmin || isSupervisor,
    canAddLoading:       isAdmin || isSupervisor || isUser,
    canEditLoading:      isAdmin || isSupervisor,
    canDeleteLoading:    isAdmin || isSupervisor,
    canViewDashboard:    isAdmin || isSupervisor || isDashboardUser,
    canManageUsers:      isAdmin,
    canAccessVehicleEntry: isAdmin || isSupervisor || isSecurityUser,

    // Backward-compat aliases
    canEdit:             isAdmin || isSupervisor,
    canDelete:           isAdmin || isSupervisor,
    isPowerUser:         isSupervisor,
  };
}
