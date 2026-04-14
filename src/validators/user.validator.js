import Joi from "joi";

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('USER').required(),

  phone: Joi.string().optional().allow(null, ''),
  avatarUrl: Joi.string().uri().optional().allow(null, ''),
  city: Joi.string().optional().allow(null, ''),
  country: Joi.string().optional().allow(null, ''),
  bio: Joi.string().max(500).optional().allow(null, '')
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  isActive: Joi.boolean(),

  phone: Joi.string().allow(null, ''),
  avatarUrl: Joi.string().uri().allow(null, ''),
  city: Joi.string().allow(null, ''),
  country: Joi.string().allow(null, ''),
  bio: Joi.string().max(500).allow(null, '')
}).min(1);

export const userIdParamSchema = Joi.object({
  userId: Joi.number().integer().positive().required()
});

