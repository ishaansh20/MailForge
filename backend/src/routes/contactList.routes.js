const express = require("express");

const { authenticate } = require("../middleware/authMiddleware");
const {
  list,
  getById,
  create,
  update,
  remove,
  members,
  availableContacts,
  addMembers,
  removeMember,
  removeMembers,
  addNewMembers,
} = require("../controllers/contactList.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", list);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

router.get("/:id/members", members);
router.get("/:id/available-contacts", availableContacts);
router.post("/:id/members", addMembers);
router.post("/:id/members/remove", removeMembers);
router.post("/:id/members/manual", addNewMembers);
router.delete("/:id/members/:contactId", removeMember);

module.exports = { contactListRouter: router };
