require('dotenv').config();

module.exports = {
  merchantKey: process.env.PAYU_MERCHANT_KEY,
  merchantSalt: process.env.PAYU_MERCHANT_SALT,
  baseURL: process.env.PAYU_BASE_URL || 'https://securegw.paytm.in',
  successURL: `${process.env.BASE_URL}/api/payments/success`,
  failureURL: `${process.env.BASE_URL}/api/payments/failure`,
  testMode: process.env.NODE_ENV !== 'production'
}; 