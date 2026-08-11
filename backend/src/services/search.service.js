const { listContacts } = require("./contact.service");
const { listCampaigns } = require("./campaign.service");
const { listTemplates } = require("./template.service");
const { listContactLists } = require("./contactList.service");
const { listSmtpConfigs } = require("./smtp.service");
const { listLogs } = require("./log.service");

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 5;

const EMPTY_RESULTS = {
  contacts: [],
  campaigns: [],
  templates: [],
  lists: [],
  smtp: [],
  logs: [],
};

async function globalSearch(query) {
  const trimmedQuery = (query || "").trim();

  if (trimmedQuery.length < MIN_QUERY_LENGTH) {
    return EMPTY_RESULTS;
  }

  const [contacts, campaigns, templates, lists, smtp, logs] = await Promise.all([
    listContacts({ search: trimmedQuery, limit: RESULT_LIMIT }),
    listCampaigns({ search: trimmedQuery, limit: RESULT_LIMIT }),
    listTemplates({ search: trimmedQuery, limit: RESULT_LIMIT }),
    listContactLists({ search: trimmedQuery, limit: RESULT_LIMIT }),
    listSmtpConfigs({ search: trimmedQuery, limit: RESULT_LIMIT }),
    listLogs({ search: trimmedQuery, limit: RESULT_LIMIT }),
  ]);

  return {
    contacts: contacts.items,
    campaigns: campaigns.items,
    templates: templates.items,
    lists: lists.items,
    smtp: smtp.items,
    logs: logs.items,
  };
}

module.exports = { globalSearch };
