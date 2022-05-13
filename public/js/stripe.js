/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

// Using the stripe object and passing the public key
const stripe = Stripe(
  'pk_test_51KyrOcFr1i1Q0ia97iEgBd6QuMrhLwytonOkIcuWFjQ3kqtWhkQGSvxNhgJhfcnzCwu50ULjgOtFW7GRpgKfDBpT00xlBagVZF'
);

// Function that take in a tour ID which comes from the user interface
export const bookTour = async tourId => {
  try {
    // 1) Get the checkout session from the server
    const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);

    // 2) Use stripe object to automatically create the checkout form + charge credit card for us
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
