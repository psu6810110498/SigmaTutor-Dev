import Stripe from 'stripe';

// Only initialize Stripe if secret key is provided
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set. Stripe payments will not work.');
}

// Create Stripe instance only if key exists, otherwise use a dummy object
export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
  : null as unknown as Stripe; // Type cast to avoid breaking imports
