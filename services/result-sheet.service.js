const ResultSheet = require("../models/ResultSheet");
const { ApiError } = require("../utils/apiError");
const { purgeExpired } = require("./retention.service");

function serialize(doc) {
  return {
    id: doc.sheetKey,
    title: doc.title,
    className: doc.className || "",
    section: doc.section || "",
    month: doc.month,
    savedOn: doc.savedOn || "",
    nameWidth: doc.nameWidth ?? 180,
    noWidth: doc.noWidth || 0,
    marksWidth: doc.marksWidth || 0,
    obtainedWidth: doc.obtainedWidth || 0,
    percentWidth: doc.percentWidth || 0,
    positionWidth: doc.positionWidth || 0,
    subjectRowHeight: doc.subjectRowHeight || 0,
    labelRowHeight: doc.labelRowHeight || 0,
    columns: Array.isArray(doc.columns) ? doc.columns : [],
    rows: Array.isArray(doc.rows) ? doc.rows : [],
    textStyles: doc.textStyles || {},
    files: Array.isArray(doc.files) ? doc.files : [],
  };
}

function canEdit(auth) {
  return auth.role === "owner" || auth.role === "teacher";
}

function resultSheetService() {
  return {
    async list(auth) {
      await purgeExpired(auth.institutionId);
      if (!canEdit(auth)) return [];
      const rows = await ResultSheet.find({ institution: auth.institutionId }).sort({ updatedAt: -1 });
      return rows.map(serialize);
    },

    async save(auth, input) {
      if (!canEdit(auth)) throw new ApiError(403, "You cannot save a result sheet.");
      const sheetKey = input.id || `${Date.now()}`;
      const { id, ...fields } = input;
      void id;
      const doc = await ResultSheet.findOneAndUpdate(
        { institution: auth.institutionId, sheetKey },
        {
          $set: {
            ...fields,
            sheetKey,
            institution: auth.institutionId,
            institutionCode: auth.institutionCode,
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      if (!doc) throw new ApiError(500, "The result sheet could not be saved.");
      return serialize(doc);
    },

    async remove(auth, sheetKey) {
      if (!canEdit(auth)) throw new ApiError(403, "You cannot delete a result sheet.");
      const key = String(sheetKey || "").trim();
      if (!key) throw new ApiError(404, "That result sheet was not found.");
      const doc = await ResultSheet.findOneAndDelete({ institution: auth.institutionId, sheetKey: key });
      if (!doc) throw new ApiError(404, "That result sheet was not found.");
    },
  };
}

module.exports = { resultSheets: resultSheetService() };
