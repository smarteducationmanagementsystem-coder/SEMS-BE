const { v2: cloudinary } = require("cloudinary");
const { ApiError } = require("../utils/apiError");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg", "ico", "heic", "heif", "avif", "tif", "tiff", "jfif"]);

function institutionFolder(institution) {
  const code = String(institution.code || institution._id || "institution").replace(/[^\w.-]/g, "");
  return `institutions/${code || "institution"}`;
}

function isLogoFile(mimetype, filename) {
  if (String(mimetype || "").toLowerCase().startsWith("image/")) return true;
  const extension = String(filename || "").split(".").pop().toLowerCase();
  return IMAGE_EXTENSIONS.has(extension);
}

function imageMime(mimetype, filename) {
  const type = String(mimetype || "").toLowerCase();
  if (type.startsWith("image/")) return type;
  const extension = String(filename || "").split(".").pop().toLowerCase();
  const known = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    jfif: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    heic: "image/heic",
    heif: "image/heif",
    avif: "image/avif",
    tif: "image/tiff",
    tiff: "image/tiff",
  };
  return known[extension] || "image/png";
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, uploaded) => {
      if (error || !uploaded?.secure_url) {
        reject(error || new Error("Could not store the file."));
        return;
      }
      resolve(uploaded);
    });
    stream.end(buffer);
  });
}

function uploadFailure(error, label) {
  const text = String(error?.message || "");
  console.error(`Cloudinary ${label} upload failed:`, text);
  if (error?.http_code === 403 || text.includes("missing permissions") || text.includes("403")) {
    return new ApiError(502, `Cloudinary blocked the ${label}. Allow this API key to upload images, then try again.`);
  }
  return new ApiError(502, `Could not store the ${label}.`);
}

async function uploadInstitutionLogo(institution, buffer, mimetype, filename) {
  if (!isLogoFile(mimetype, filename)) throw new ApiError(400, "Choose an image file.");
  try {
    const uploaded = await uploadBuffer(buffer, {
      folder: institutionFolder(institution),
      public_id: "logo",
      overwrite: true,
      resource_type: "image",
      unique_filename: false,
    });
    return { logoUrl: uploaded.secure_url, logoPublicId: uploaded.public_id };
  } catch (error) {
    if (error instanceof ApiError && error.status !== 502) throw error;
    throw uploadFailure(error, "logo");
  }
}

async function uploadResultImage(institution, buffer, mimetype, filename) {
  if (!isLogoFile(mimetype, filename)) throw new ApiError(400, "Choose an image file.");
  const publicId = `result-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    const uploaded = await uploadBuffer(buffer, {
      folder: `${institutionFolder(institution)}/results`,
      public_id: publicId,
      overwrite: false,
      resource_type: "image",
      unique_filename: false,
    });
    return { imageUrl: uploaded.secure_url, publicId: uploaded.public_id };
  } catch (error) {
    if (error instanceof ApiError && error.status !== 502) throw error;
    throw uploadFailure(error, "result image");
  }
}

async function destroyAsset(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    // Removing the database URL still hides the logo if Cloudinary cleanup fails.
  }
}

async function folderBytes(prefix) {
  const folder = String(prefix || "").replace(/\/$/, "");
  if (!folder) return 0;
  let total = 0;
  let cursor = "";
  for (let page = 0; page < 20; page += 1) {
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: folder,
      max_results: 500,
      ...(cursor ? { next_cursor: cursor } : {}),
    });
    const resources = Array.isArray(result?.resources) ? result.resources : [];
    total += resources.reduce((sum, item) => sum + Number(item.bytes || 0), 0);
    cursor = result?.next_cursor || "";
    if (!cursor) break;
  }
  return total;
}

module.exports = { institutionFolder, isLogoFile, imageMime, uploadInstitutionLogo, uploadResultImage, destroyAsset, folderBytes };
