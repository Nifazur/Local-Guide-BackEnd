import Joi from 'joi';

export const createPaymentIntentSchema = {
  body: Joi.object({
    bookingId: Joi.string().uuid().required().messages({
      'any.required': 'Booking ID is required',
    }),
  }),
};

export const confirmPaymentSchema = {
  body: Joi.object({
    bookingId: Joi.string().uuid().required(),
    paymentIntentId: Joi.string().required(),
  }),
};

export const getPaymentsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('PENDING', 'PAID', 'REFUNDED', 'FAILED').optional(),
  }),
};

export const getPaymentSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const refundPaymentSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    reason: Joi.string().optional(),
  }),
};