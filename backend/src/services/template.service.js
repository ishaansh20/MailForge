const { ApiError } = require("../utils/ApiError");
const { Template } = require("../models/template.model");

function sanitizeTemplate(template) {
  return {
    id: template._id.toString(),
    name: template.name,
    subject: template.subject,
    body: template.body,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

async function ensureUniqueName(name, excludeId) {
  const query = { name: name.trim() };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await Template.findOne(query);

  if (existing) {
    throw new ApiError(409, "A template with this name already exists", "TEMPLATE_NAME_EXISTS");
  }
}

async function listTemplates({ page = 1, limit = 10, search = "" } = {}) {
  const query = {};

  if (search) {
    const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: searchRegex }, { subject: searchRegex }];
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * pageSize;

  const [items, total] = await Promise.all([
    Template.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    Template.countDocuments(query),
  ]);

  return {
    items: items.map(sanitizeTemplate),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

async function getTemplateById(id) {
  const template = await Template.findById(id);

  if (!template) {
    throw new ApiError(404, "Template not found", "TEMPLATE_NOT_FOUND");
  }

  return sanitizeTemplate(template);
}

async function createTemplate(payload) {
  await ensureUniqueName(payload.name);

  const template = await Template.create({
    name: payload.name.trim(),
    subject: payload.subject.trim(),
    body: payload.body,
  });

  return sanitizeTemplate(template);
}

async function updateTemplate(id, payload) {
  const template = await Template.findById(id);

  if (!template) {
    throw new ApiError(404, "Template not found", "TEMPLATE_NOT_FOUND");
  }

  if (payload.name && payload.name.trim() !== template.name) {
    await ensureUniqueName(payload.name, id);
    template.name = payload.name.trim();
  }

  if (payload.subject !== undefined) template.subject = payload.subject.trim();
  if (payload.body !== undefined) template.body = payload.body;

  await template.save();

  return sanitizeTemplate(template);
}

async function deleteTemplate(id) {
  const template = await Template.findById(id);

  if (!template) {
    throw new ApiError(404, "Template not found", "TEMPLATE_NOT_FOUND");
  }

  await template.deleteOne();
}

module.exports = {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
