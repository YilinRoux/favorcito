import { getAssetBaseUrl } from "./runtimeUrls";

const BASE_URL = getAssetBaseUrl();

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  const value = String(imagePath).trim();
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;

  const normalizedValue = value.replaceAll("\\", "/");

  const normalizedPath = normalizedValue.startsWith("/")
    ? normalizedValue
    : normalizedValue.startsWith("uploads/")
      ? `/${normalizedValue}`
      : `/uploads/${normalizedValue}`;

  return `${BASE_URL}${normalizedPath}`;
};
