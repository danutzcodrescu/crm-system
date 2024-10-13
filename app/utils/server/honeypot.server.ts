import { Honeypot } from 'remix-utils/honeypot/server';

// Create a new Honeypot instance, the values here are the defaults, you can
// customize them
export const honeypot = new Honeypot({
  randomizeNameFieldName: true,
  nameFieldName: 'name__confirm',
  validFromFieldName: 'from__confirm',
});
