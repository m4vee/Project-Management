import { supabase } from "../config/supabase";

export const uploadProductImage = async (file) => {
  try {
    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    console.log("Upload successful:", data);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const uploadMultipleImages = async (files) => {
  const uploadPromises = Array.from(files).map((file) =>
    uploadProductImage(file)
  );
  return Promise.all(uploadPromises);
};
