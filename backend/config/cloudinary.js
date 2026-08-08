import { v2 as cloudinary } from "cloudinary";

const parseCloudinaryUrl = (value) => {
  if (!value) return null;

  try {
    const parsed = new URL(value.trim());

    if (parsed.protocol !== "cloudinary:") {
      return null;
    }

    const cloud_name = parsed.hostname;
    const api_key = decodeURIComponent(parsed.username || "");
    const api_secret = decodeURIComponent(parsed.password || "");

    if (!cloud_name || !api_key || !api_secret) {
      return null;
    }

    return {
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    };
  } catch {
    return null;
  }
};

const getCloudinaryConfig = () => {
  const fromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
  if (fromUrl) return fromUrl;

  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloud_name || !api_key || !api_secret) {
    return null;
  }

  return {
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  };
};

const cloudinaryConfig = getCloudinaryConfig();
const hasCloudinaryConfig = Boolean(cloudinaryConfig);

if (hasCloudinaryConfig) {
  cloudinary.config(cloudinaryConfig);
}

export { cloudinary, hasCloudinaryConfig };
