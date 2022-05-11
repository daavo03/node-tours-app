/* eslint-disable */

// Function for hiding alerts
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  // Moving 1 level up to the parent element from there remove a child element
  if (el) el.parentElement.removeChild(el);
};

// Type is either 'success' or 'error'
export const showAlert = (type, msg) => {
  // Whenever show alert first hide alerts already exists
  hideAlert();

  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  // Selecting element where we want to include this html we just created
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  // Hide all alerts after 5s
  window.setTimeout(hideAlert, 5000);
};
