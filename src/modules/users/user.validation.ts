import Joi from 'joi';

export const getUsersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid('TOURIST', 'GUIDE', 'ADMIN').optional(),
    search: Joi.string().optional(),
    city: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
  }),
};

export const getUserSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const updateUserSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    bio: Joi.string().max(500).optional().allow(''),
    phone: Joi.string().optional().allow(''),
    languages: Joi.array().items(Joi.string()).optional(),
    profilePic: Joi.string().uri().optional().allow(''),
    // Guide specific
    expertise: Joi.array().items(Joi.string()).optional(),
    dailyRate: Joi.number().min(0).optional(),
    city: Joi.string().optional(),
    country: Joi.string().optional(),
    // Tourist specific
    travelPreferences: Joi.array().items(Joi.string()).optional(),
  }),
};

export const updateUserStatusSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    isActive: Joi.boolean().required(),
  }),
};

export const getGuidesSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    city: Joi.string().optional(),
    country: Joi.string().optional(),
    language: Joi.string().optional(),
    expertise: Joi.string().optional(),
    minRate: Joi.number().min(0).optional(),
    maxRate: Joi.number().min(0).optional(),
    search: Joi.string().optional(),
  }),
};