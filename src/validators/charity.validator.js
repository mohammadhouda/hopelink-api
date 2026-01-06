import Joi from "joi";

export const createCharitySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),

  email: Joi.string().email().required(),

  password: Joi.string().min(8).max(128).required(),

  logoUrl: Joi.string().uri().optional().allow(null, ""),

  phone: Joi.string().min(6).max(20).optional().allow(null, ""),

  address: Joi.string().max(255).optional().allow(null, ""),

  websiteUrl: Joi.string().uri().optional().allow(null, ""),

  city: Joi.string().max(100).optional().allow(null, ""),

  category: Joi.string().max(100).optional().allow(null, ""),
});

export const updateCharitySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),

  email: Joi.string().email().optional(),

  isActive: Joi.boolean().optional(),

  description: Joi.string().max(500).optional().allow(null, ""),

  logoUrl: Joi.string().uri().optional().allow(null, ""),

  phone: Joi.string().min(6).max(20).optional().allow(null, ""),

  address: Joi.string().max(255).optional().allow(null, ""),

  websiteUrl: Joi.string().uri().optional().allow(null, ""),

  city: Joi.string().max(100).optional().allow(null, ""),

  category: Joi.string().max(100).optional().allow(null, ""),
}).min(1);

export const charityIdParamSchema = Joi.object({
    userId: Joi.number().integer().positive().required()
    });
