import Joi from 'joi';

export const createListingSchema = {
  body: Joi.object({
    title: Joi.string().min(5).max(200).required().messages({
      'string.min': 'Title must be at least 5 characters',
      'any.required': 'Title is required',
    }),
    description: Joi.string().min(20).max(2000).required().messages({
      'string.min': 'Description must be at least 20 characters',
      'any.required': 'Description is required',
    }),
    itinerary: Joi.string().max(2000).optional().allow(''),
    tourFee: Joi.number().min(0).required().messages({
      'any.required': 'Tour fee is required',
    }),
    duration: Joi.number().integer().min(1).max(24).required().messages({
      'any.required': 'Duration is required',
    }),
    meetingPoint: Joi.string().required().messages({
      'any.required': 'Meeting point is required',
    }),
    maxGroupSize: Joi.number().integer().min(1).max(50).required().messages({
      'any.required': 'Max group size is required',
    }),
    city: Joi.string().required(),
    country: Joi.string().required(),
    category: Joi.array().items(Joi.string()).min(1).required(),
    images: Joi.array().items(Joi.string().uri()).optional(),
  }),
};

export const updateListingSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(20).max(2000).optional(),
    itinerary: Joi.string().max(2000).optional().allow(''),
    tourFee: Joi.number().min(0).optional(),
    duration: Joi.number().integer().min(1).max(24).optional(),
    meetingPoint: Joi.string().optional(),
    maxGroupSize: Joi.number().integer().min(1).max(50).optional(),
    city: Joi.string().optional(),
    country: Joi.string().optional(),
    category: Joi.array().items(Joi.string()).min(1).optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    isActive: Joi.boolean().optional(),
  }),
};

export const getListingsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    city: Joi.string().optional(),
    country: Joi.string().optional(),
    category: Joi.string().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    duration: Joi.number().integer().min(1).optional(),
    search: Joi.string().optional(),
    guideId: Joi.string().uuid().optional(),
    sortBy: Joi.string().valid('price', 'rating', 'newest').default('newest'),
  }),
};

export const getListingSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const getMyListingsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};