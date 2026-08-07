export const uploadImageToBackend = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('http://localhost:5000/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  const data = await response.json();
  return data.secure_url; // the optimized Cloudinary URL
};
