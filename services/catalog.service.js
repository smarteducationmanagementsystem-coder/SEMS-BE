const Institution = require("../models/Institution");
const { escapeRegex } = require("../utils/text");

async function listCities() {
  const rows = await Institution.aggregate([
    { $project: { city: { $trim: { input: "$city" } } } },
    { $match: { city: { $ne: "" } } },
    { $group: { _id: { $toLower: "$city" }, city: { $first: "$city" } } },
    { $sort: { city: 1 } },
  ]);
  return rows.map((row) => row.city);
}

async function listInstitutions({ city, type }) {
  const rows = await Institution.find({
    city: new RegExp(`^${escapeRegex(city)}$`, "i"),
    type,
  })
    .select("name city type")
    .sort({ name: 1 });

  return rows.map((row) => ({
    id: String(row._id),
    name: row.name,
    city: row.city,
    type: row.type,
  }));
}

module.exports = { listCities, listInstitutions };
