import Joi from 'joi';

export const createReviewSchema = {
  body: Joi.object({
    bookingId: Joi.string().uuid().required().messages({
      'any.required': 'Booking ID is required',
    }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating cannot exceed 5',
      'any.required': 'Rating is required',
    }),
    comment: Joi.string().min(10).max(1000).required().messages({
      'string.min': 'Review must be at least 10 characters',
      'any.required': 'Review comment is required',
    }),
  }),
};

export const updateReviewSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional(),
    comment: Joi.string().min(10).max(1000).optional(),
  }),
};

export const getReviewsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    guideId: Joi.string().uuid().optional(),
    listingId: Joi.string().uuid().optional(),
    rating: Joi.number().integer().min(1).max(5).optional(),
  }),
};

export const getReviewSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const getMyReviewsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};