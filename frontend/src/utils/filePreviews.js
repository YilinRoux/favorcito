const imageExtensionPattern = /\.(avif|gif|heic|heif|jpe?g|png|webp)$/i;

const isImageFile = (file) => {
  return file.type.startsWith("image/") || imageExtensionPattern.test(file.name);
};

const readAsDataUrl = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        name: file.name,
        src: typeof reader.result === "string" ? reader.result : "",
      });
    };

    reader.onerror = () => {
      resolve(null);
    };

    reader.readAsDataURL(file);
  });

export const prepareImageFiles = async (fileList, maxFiles) => {
  const files = Array.from(fileList || [])
    .filter(isImageFile)
    .slice(0, maxFiles);

  const previews = (await Promise.all(files.map(readAsDataUrl))).filter(
    (preview) => preview?.src
  );

  return { files, previews };
};
