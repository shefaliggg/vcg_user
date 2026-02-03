// Error message parser for user-friendly feedback
const getErrorMessage = (error) => {
  // Network error
  if (!error.response) {
    return 'Network error. Please check your connection and try again.';
  }

  const status = error.response.status;
  const message = error.response.data?.message;

  switch (status) {
    case 400:
      if (message.includes('Missing')) {
        return 'Please fill in all required fields.';
      }
      return message || 'Invalid input. Please check your information.';

    case 401:
      if (message.includes('credentials')) {
        return 'Incorrect email or password. Please try again.';
      }
      if (message.includes('token')) {
        return 'Your session expired. Please login again.';
      }
      return 'Authentication failed.';

    case 403:
      return 'You don\'t have permission to perform this action.';

    case 409:
      if (message.includes('email')) {
        return 'This email is already registered. Please login or use a different email.';
      }
      return 'This account already exists.';

    case 500:
      return 'Server error. Please try again later.';

    default:
      return message || 'Something went wrong. Please try again.';
  }
};

export default getErrorMessage;
