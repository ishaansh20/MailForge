const dns = require("dns").promises;

async function hasMxRecord(email) {
  const domain = (email || "").split("@")[1];

  if (!domain) {
    return false;
  }

  try {
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

module.exports = { hasMxRecord };
