const express = require('express')
const userRoutes = express.Router()

const {getPayment} = require('../Controllers/userController/paymentGateway')

userRoutes
    .route('/make-payment')
    .post(getPayment)

    .route('/get-services')
    .get()

    .route('/apply-coupon')
    .get()

    .route('/get-occ-dates')
    .get()


module.exports = userRoutes