/* eslint-disable */
// This file will be the entry file. File to get data from the user interface and delegate actions

import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login } from './login';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form');

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

// Event listener for the submit event on the login form
if (loginForm)
  loginForm.addEventListener('submit', e => {
    // Preventing the form from loading any other page
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
