export const getToken = async (): Promise<string> => {
  // Get token from localStorage
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};
