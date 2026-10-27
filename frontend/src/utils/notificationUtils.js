/**
 * Resolves target navigation route for a notification based on its message text and user role.
 */
export const getNotificationTarget = (notification, userRole) => {
  const message = (typeof notification === 'string' ? notification : notification?.message || '').toLowerCase();

  if (userRole === 'MAIN_ADMIN') {
    // Dataset requests
    if (message.includes('dataset')) {
      return '/admin/datasets';
    }
    // Requests: Profile updates, Organization registrations, User approvals
    if (
      message.includes('request') ||
      message.includes('profile') ||
      message.includes('update') ||
      message.includes('registration') ||
      message.includes('approval') ||
      message.includes('org') ||
      message.includes('organization')
    ) {
      return '/admin/requests';
    }
    // Users management
    if (message.includes('user')) {
      return '/admin/users';
    }
    return '/admin/requests';
  }

  if (userRole === 'SECONDARY_ADMIN') {
    // Complaint related notifications
    if (
      message.includes('complaint') ||
      message.includes('priority') ||
      message.includes('resolved') ||
      message.includes('received') ||
      message.includes('status') ||
      message.includes('reopened') ||
      message.includes('cmp-')
    ) {
      return '/secondary-admin/complaints';
    }
    // Organization dataset
    if (message.includes('dataset')) {
      return '/secondary-admin/dataset';
    }
    // Organization profile or users
    if (
      message.includes('profile') ||
      message.includes('organization') ||
      message.includes('user') ||
      message.includes('approved')
    ) {
      return '/secondary-admin/organization';
    }
    return '/secondary-admin/dashboard';
  }

  if (userRole === 'USER') {
    // User complaints tracking
    if (
      message.includes('complaint') ||
      message.includes('status') ||
      message.includes('resolved') ||
      message.includes('marked') ||
      message.includes('priority') ||
      message.includes('reopened') ||
      message.includes('cmp-')
    ) {
      return '/user/my-complaints';
    }
    // Organization
    if (message.includes('organization') || message.includes('approved')) {
      return '/user/my-organization';
    }
    return '/user/my-complaints';
  }

  return '/';
};
