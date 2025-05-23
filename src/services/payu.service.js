const crypto = require('crypto');
const axios = require('axios');

class PayUService {
  constructor() {
    this.merchantKey = process.env.PAYU_MERCHANT_KEY;
    this.merchantSalt = process.env.PAYU_MERCHANT_SALT;
    this.baseUrl = process.env.PAYU_BASE_URL || 'https://securegw.paytm.in';
  }

  generateHash(data) {
    const hashString = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('|');
    
    return crypto
      .createHash('sha512')
      .update(hashString + this.merchantSalt)
      .digest('hex');
  }

  async initiatePayment(paymentData) {
    const {
      bookingId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      productInfo
    } = paymentData;

    const txnId = `PLUMERIA_${bookingId}_${Date.now()}`;
    
    const paymentParams = {
      key: this.merchantKey,
      txnid: txnId,
      amount: amount.toString(),
      productinfo: productInfo,
      firstname: customerName,
      email: customerEmail,
      phone: customerPhone,
      surl: `${process.env.BASE_URL}/api/payments/success`,
      furl: `${process.env.BASE_URL}/api/payments/failure`,
      hash: ''
    };

    paymentParams.hash = this.generateHash(paymentParams);

    return {
      paymentUrl: `${this.baseUrl}/_payment`,
      paymentParams
    };
  }

  async verifyPayment(paymentData) {
    const hash = this.generateHash(paymentData);
    
    if (hash !== paymentData.hash) {
      throw new Error('Invalid payment hash');
    }

    return {
      isValid: true,
      transactionId: paymentData.txnid,
      paymentId: paymentData.payuMoneyId,
      status: paymentData.status
    };
  }
}

module.exports = new PayUService(); 