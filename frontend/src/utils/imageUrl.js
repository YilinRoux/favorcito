import { getAssetBaseUrl } from "./runtimeUrls";

const BASE_URL = getAssetBaseUrl();

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const normalizedPath = imagePath.startsWith("/")
    ? imagePath
    : imagePath.startsWith("uploads/")
      ? `/${imagePath}`
      : `/uploads/${imagePath}`;

  return `${BASE_URL}${normalizedPath}`;
};
