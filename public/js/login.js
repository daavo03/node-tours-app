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
      url: 'http://127.0.0.1:3000/api/v1/users/login',
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
