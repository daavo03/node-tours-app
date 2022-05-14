/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

// Creating login function
export const login = async (email, password) => {
  // In order to do HTTP requests need to use axios
  try {
    const res = await axios({
      // Options for the request
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password
      }
    });

    // Showing alert and reloading the page in case we're sure the API call was successful
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      // Load the home page
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });

    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};
