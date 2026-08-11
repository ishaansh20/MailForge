const { ApiError } = require("../utils/ApiError");
const { ContactList } = require("../models/contactList.model");
const { Contact } = require("../models/contact.model");
const { hasMxRecord } = require("../utils/emailDomainCheck.util");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeContactList(list, memberCount = 0) {
  return {
    id: list._id.toString(),
    name: list.name,
    description: list.description,
    memberCount,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  };
}

function sanitizeContact(contact) {
  return {
    id: contact._id.toString(),
    name: contact.name,
    email: contact.email,
    status: contact.status,
  };
}

async function ensureUniqueName(name, excludeId) {
  const query = { name: name.trim() };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await ContactList.findOne(query);

  if (existing) {
    throw new ApiError(409, "A list with this name already exists", "LIST_NAME_EXISTS");
  }
}

async function getMemberCounts(listIds) {
  if (listIds.length === 0) {
    return new Map();
  }

  const counts = await Contact.aggregate([
    { $match: { lists: { $in: listIds } } },
    { $unwind: "$lists" },
    { $match: { lists: { $in: listIds } } },
    { $group: { _id: "$lists", count: { $sum: 1 } } },
  ]);

  return new Map(counts.map((entry) => [entry._id.toString(), entry.count]));
}

async function listContactLists({ page = 1, limit = 10, search = "" } = {}) {
  const query = {};

  if (search) {
    const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * pageSize;

  const [items, total] = await Promise.all([
    ContactList.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    ContactList.countDocuments(query),
  ]);

  const countMap = await getMemberCounts(items.map((item) => item._id));

  return {
    items: items.map((item) => sanitizeContactList(item, countMap.get(item._id.toString()) || 0)),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

async function getContactListById(id) {
  const list = await ContactList.findById(id);

  if (!list) {
    throw new ApiError(404, "List not found", "LIST_NOT_FOUND");
  }

  const memberCount = await Contact.countDocuments({ lists: list._id });

  return sanitizeContactList(list, memberCount);
}

async function createContactList(payload) {
  await ensureUniqueName(payload.name);

  const list = await ContactList.create({
    name: payload.name.trim(),
    description: (payload.description || "").trim(),
  });

  return sanitizeContactList(list, 0);
}

async function updateContactList(id, payload) {
  const list = await ContactList.findById(id);

  if (!list) {
    throw new ApiError(404, "List not found", "LIST_NOT_FOUND");
  }

  if (payload.name && payload.name.trim() !== list.name) {
    await ensureUniqueName(payload.name, id);
    list.name = payload.name.trim();
  }

  if (payload.description !== undefined) {
    list.description = payload.description.trim();
  }

  await list.save();

  const memberCount = await Contact.countDocuments({ lists: list._id });

  return sanitizeContactList(list, memberCount);
}

async function deleteContactList(id) {
  const list = await ContactList.findById(id);

  if (!list) {
    throw new ApiError(404, "List not found", "LIST_NOT_FOUND");
  }

  await Contact.updateMany({ lists: list._id }, { $pull: { lists: list._id } });
  await list.deleteOne();
}

async function getListMembers(listId, { page = 1, limit = 10, search = "" } = {}) {
  const list = await ContactList.findById(listId);

  if (!list) {
    throw new ApiError(404, "List not found", "LIST_NOT_FOUND");
  }

  const query = { lists: listId };

  if (search) {
    const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * pageSize;

  const [items, total] = await Promise.all([
    Contact.find(query).sort({ name: 1 }).skip(skip).limit(pageSize),
    Contact.countDocuments(query),
  ]);

  return {
    items: items.map(sanitizeContact),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

async function getAvailableContacts(listId, { page = 1, limit = 10, search = "" } = {}) {
  const list = await ContactList.findById(listId);

  if (!list) {
    throw new ApiError(404, "List not found", "LIST_NOT_FOUND");
  }

  const query = { lists: { $ne: listId } };

  if (search) {
    const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * pageSize;

  const [items, total] = await Promise.all([
    Contact.find(query).sort({ name: 1 }).skip(skip).limit(pageSize),
    Contact.countDocuments(query),
  ]);

  return {
    items: items.map(sanitizeContact),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

async function addContactsToList(listId, contactIds) {
  const list = await ContactList.findById(listId);

  if (!list) {
    throw new ApiError(404, "List not found", "LIST_NOT_FOUND");
  }

  if (!Array.isArray(contactIds) || contactIds.length === 0) {
    throw new ApiError(400, "At least one contact must be selected", "LIST_NO_CONTACTS_SELECTED");
  }

  await Contact.updateMany(
    { _id: { $in: contactIds } },
    { $addToSet: { lists: list._id } },
  );
}

async function removeContactFromList(listId, contactId) {
  const list = await ContactList.findById(listId);

  if (!list) {
    throw new ApiError(404, "List not found", "LIST_NOT_FOUND");
  }

  await Contact.updateOne({ _id: contactId }, { $pull: { lists: list._id } });
}

async function removeContactsFromList(listId, contactIds) {
  const list = await ContactList.findById(listId);

  if (!list) {
    throw new ApiError(404, "List not found", "LIST_NOT_FOUND");
  }

  if (!Array.isArray(contactIds) || contactIds.length === 0) {
    throw new ApiError(400, "At least one contact must be selected", "LIST_NO_CONTACTS_SELECTED");
  }

  await Contact.updateMany(
    { _id: { $in: contactIds } },
    { $pull: { lists: list._id } },
  );
}

async function addNewContactsToList(listId, contacts) {
  const list = await ContactList.findById(listId);

  if (!list) {
    throw new ApiError(404, "List not found", "LIST_NOT_FOUND");
  }

  if (!Array.isArray(contacts) || contacts.length === 0) {
    throw new ApiError(400, "At least one contact must be provided", "LIST_NO_CONTACTS_SELECTED");
  }

  const result = { added: 0, skipped: 0, errors: [] };

  const seenEmails = new Set();
  const candidates = [];

  contacts.forEach((row, index) => {
    const rowNumber = index + 1;
    const name = (row.name || "").trim();
    const email = (row.email || "").trim().toLowerCase();

    if (!email || !EMAIL_PATTERN.test(email)) {
      result.skipped += 1;
      result.errors.push({ row: rowNumber, reason: "Invalid or missing email" });
      return;
    }

    if (!name) {
      result.skipped += 1;
      result.errors.push({ row: rowNumber, reason: "Missing name" });
      return;
    }

    if (seenEmails.has(email)) {
      result.skipped += 1;
      result.errors.push({ row: rowNumber, reason: "Duplicate email in this submission" });
      return;
    }

    seenEmails.add(email);
    candidates.push({ name, email, rowNumber });
  });

  if (candidates.length > 0) {
    const existingContacts = await Contact.find({
      email: { $in: candidates.map((candidate) => candidate.email) },
    }).select("email");
    const existingByEmail = new Map(existingContacts.map((contact) => [contact.email, contact]));

    const candidateFreshRows = candidates.filter((candidate) => !existingByEmail.has(candidate.email));
    const existingIds = candidates
      .filter((candidate) => existingByEmail.has(candidate.email))
      .map((candidate) => existingByEmail.get(candidate.email)._id);

    const mxResults = await Promise.all(
      candidateFreshRows.map((candidate) => hasMxRecord(candidate.email)),
    );

    const freshRows = [];

    candidateFreshRows.forEach((candidate, index) => {
      if (mxResults[index]) {
        freshRows.push(candidate);
      } else {
        result.skipped += 1;
        result.errors.push({
          row: candidate.rowNumber,
          reason: `Email domain does not accept mail: ${candidate.email}`,
        });
      }
    });

    let createdIds = [];

    if (freshRows.length > 0) {
      const created = await Contact.insertMany(
        freshRows.map((row) => ({ name: row.name, email: row.email })),
        { ordered: false },
      );
      createdIds = created.map((contact) => contact._id);
    }

    const allIds = [...createdIds, ...existingIds];

    if (allIds.length > 0) {
      await Contact.updateMany(
        { _id: { $in: allIds } },
        { $addToSet: { lists: list._id } },
      );
    }

    result.added = allIds.length;
  }

  return result;
}

module.exports = {
  listContactLists,
  getContactListById,
  createContactList,
  updateContactList,
  deleteContactList,
  getListMembers,
  getAvailableContacts,
  addContactsToList,
  removeContactFromList,
  removeContactsFromList,
  addNewContactsToList,
};
