const express = require('express')
const adminRoutes = express.Router()

const {getPayment} = require('../Controllers/userController/paymentGateway')

adminRoutes
    .route('/make-payment')
    .post(getPayment)



module.exports = adminRoutes