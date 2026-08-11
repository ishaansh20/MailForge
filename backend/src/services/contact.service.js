const { ApiError } = require("../utils/ApiError");
const { parseCsv } = require("../utils/csv.util");
const { hasMxRecord } = require("../utils/emailDomainCheck.util");
const { Contact, CONTACT_STATUS } = require("../models/contact.model");
const { emailPattern } = require("../validators/contact.validation");

function sanitizeContact(contact) {
  return {
    id: contact._id.toString(),
    name: contact.name,
    email: contact.email,
    status: contact.status,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

async function ensureUniqueEmail(email, excludeId) {
  const query = { email: email.trim().toLowerCase() };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await Contact.findOne(query);

  if (existing) {
    throw new ApiError(409, "A contact with this email already exists", "CONTACT_EMAIL_EXISTS");
  }
}

async function listContacts({ page = 1, limit = 10, search = "", status } = {}) {
  const query = {};

  if (search) {
    const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  if (status) {
    query.status = status;
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * pageSize;

  const [items, total] = await Promise.all([
    Contact.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
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

async function getContactById(id) {
  const contact = await Contact.findById(id);

  if (!contact) {
    throw new ApiError(404, "Contact not found", "CONTACT_NOT_FOUND");
  }

  return sanitizeContact(contact);
}

async function createContact(payload) {
  await ensureUniqueEmail(payload.email);

  const email = payload.email.trim().toLowerCase();
  const domainAcceptsMail = await hasMxRecord(email);

  if (!domainAcceptsMail) {
    throw new ApiError(
      400,
      "This email's domain doesn't appear to accept mail",
      "CONTACT_EMAIL_DOMAIN_INVALID",
    );
  }

  const contact = await Contact.create({
    name: payload.name.trim(),
    email,
  });

  return sanitizeContact(contact);
}

async function updateContact(id, payload) {
  const contact = await Contact.findById(id);

  if (!contact) {
    throw new ApiError(404, "Contact not found", "CONTACT_NOT_FOUND");
  }

  if (payload.email && payload.email.trim().toLowerCase() !== contact.email) {
    const email = payload.email.trim().toLowerCase();
    await ensureUniqueEmail(email, id);

    const domainAcceptsMail = await hasMxRecord(email);

    if (!domainAcceptsMail) {
      throw new ApiError(
        400,
        "This email's domain doesn't appear to accept mail",
        "CONTACT_EMAIL_DOMAIN_INVALID",
      );
    }

    contact.email = email;
  }

  if (payload.name !== undefined) {
    contact.name = payload.name.trim();
  }

  await contact.save();

  return sanitizeContact(contact);
}

async function deleteContact(id) {
  const contact = await Contact.findById(id);

  if (!contact) {
    throw new ApiError(404, "Contact not found", "CONTACT_NOT_FOUND");
  }

  await contact.deleteOne();
}

async function setContactStatus(id, status) {
  const contact = await Contact.findById(id);

  if (!contact) {
    throw new ApiError(404, "Contact not found", "CONTACT_NOT_FOUND");
  }

  contact.status = status;
  await contact.save();

  return sanitizeContact(contact);
}

async function getContactByUnsubscribeToken(token) {
  const contact = await Contact.findOne({ unsubscribeToken: token });

  if (!contact) {
    throw new ApiError(404, "This unsubscribe link is invalid or has expired", "CONTACT_NOT_FOUND");
  }

  return sanitizeContact(contact);
}

async function unsubscribeByToken(token) {
  const contact = await Contact.findOne({ unsubscribeToken: token });

  if (!contact) {
    throw new ApiError(404, "This unsubscribe link is invalid or has expired", "CONTACT_NOT_FOUND");
  }

  if (contact.status !== CONTACT_STATUS.UNSUBSCRIBED) {
    contact.status = CONTACT_STATUS.UNSUBSCRIBED;
    await contact.save();
  }

  return sanitizeContact(contact);
}

async function importContactsFromCsv(csvText) {
  const { rows } = parseCsv(csvText);

  const result = {
    totalRows: rows.length,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  const seenEmails = new Set();
  const candidates = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const name = (row.name || "").trim();
    const email = (row.email || "").trim().toLowerCase();

    if (!email || !emailPattern.test(email)) {
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
      result.errors.push({ row: rowNumber, reason: "Duplicate email within file" });
      return;
    }

    seenEmails.add(email);
    candidates.push({ name, email, rowNumber });
  });

  if (candidates.length > 0) {
    const existingContacts = await Contact.find({
      email: { $in: candidates.map((candidate) => candidate.email) },
    }).select("email");
    const existingEmails = new Set(existingContacts.map((contact) => contact.email));

    const freshCandidates = [];

    candidates.forEach((candidate) => {
      if (existingEmails.has(candidate.email)) {
        result.skipped += 1;
        result.errors.push({
          row: candidate.rowNumber,
          reason: `Email already exists: ${candidate.email}`,
        });
      } else {
        freshCandidates.push(candidate);
      }
    });

    const mxResults = await Promise.all(
      freshCandidates.map((candidate) => hasMxRecord(candidate.email)),
    );

    const freshRows = [];

    freshCandidates.forEach((candidate, index) => {
      if (mxResults[index]) {
        freshRows.push({ name: candidate.name, email: candidate.email });
      } else {
        result.skipped += 1;
        result.errors.push({
          row: candidate.rowNumber,
          reason: `Email domain does not accept mail: ${candidate.email}`,
        });
      }
    });

    if (freshRows.length > 0) {
      try {
        const created = await Contact.insertMany(freshRows, { ordered: false });
        result.imported = created.length;
      } catch (error) {
        const insertedCount = error?.insertedDocs?.length || 0;
        result.imported = insertedCount;
        result.skipped += freshRows.length - insertedCount;
        result.errors.push({ row: null, reason: "Some rows failed validation during import" });
      }
    }
  }

  return result;
}

module.exports = {
  listContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  setContactStatus,
  importContactsFromCsv,
  getContactByUnsubscribeToken,
  unsubscribeByToken,
};
