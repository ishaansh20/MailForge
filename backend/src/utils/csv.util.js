function parseCsv(text) {
  const lines = text
    .split(/\r\n|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  function splitLine(line) {
    return line.split(",").map((cell) => cell.trim().replace(/^"(.*)"$/, "$1"));
  }

  const headers = splitLine(lines[0]).map((header) => header.toLowerCase());

  const rows = lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = cells[index] !== undefined ? cells[index] : "";
    });

    return row;
  });

  return { headers, rows };
}

module.exports = { parseCsv };
