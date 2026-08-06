import { getAssetBaseUrl } from "./runtimeUrls";

const BASE_URL = getAssetBaseUrl();

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};
