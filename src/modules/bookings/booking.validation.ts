import Joi from 'joi';

export const createBookingSchema = {
  body: Joi.object({
    listingId: Joi.string().uuid().required().messages({
      'any.required': 'Listing ID is required',
    }),
    bookingDate: Joi.date().min('now').required().messages({
      'date.min': 'Booking date must be in the future',
      'any.required': 'Booking date is required',
    }),
    startTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required()
      .messages({
        'string.pattern.base': 'Start time must be in HH:MM format',
        'any.required': 'Start time is required',
      }),
    numberOfPeople: Joi.number().integer().min(1).max(50).default(1),
    specialRequests: Joi.string().max(500).optional().allow(''),
  }),
};

export const updateBookingStatusSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    status: Joi.string().valid('CONFIRMED', 'CANCELLED').required(),
  }),
};

export const getBookingsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
  }),
};

export const getBookingSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const completeBookingSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};