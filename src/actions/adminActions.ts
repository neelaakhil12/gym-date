"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function updatePlatformStats(stats: { id: string; label: string; value: string }[]) {
  try {
    for (const stat of stats) {
      const { error } = await supabaseAdmin
        .from("platform_stats")
        .update({ 
          label: stat.label,
          value: stat.value 
        })
        .eq("id", stat.id);

      if (error) throw error;
    }

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating platform stats:", err);
    return { error: "Failed to update stats." };
  }
}

export async function getPlatformStats() {
  try {
    const { data, error } = await supabaseAdmin
      .from("platform_stats")
      .select("*")
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error fetching stats:", err);
    return [];
  }
}

export async function getSectionVisibility() {
  try {
    const { data, error } = await supabaseAdmin
      .from("platform_stats")
      .select("value")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .single();

    if (error) throw error;
    return data.value === "true";
  } catch (err) {
    console.error("Error fetching visibility:", err);
    return true; // Default to true
  }
}

export async function updateSectionVisibility(isVisible: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from("platform_stats")
      .update({ value: isVisible ? "true" : "false" })
      .eq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating visibility:", err);
    return { error: "Failed to update visibility." };
  }
}

// Helper to upload city image to Supabase Storage
async function uploadCityImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  try {
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `cities/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("gym-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("City image upload error:", uploadError);
      return null;
    }

    const { data } = supabaseAdmin.storage.from("gym-images").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error("Error uploading city image:", err);
    return null;
  }
}

export async function addCity(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const is_featured = formData.get("is_featured") === "true";
    const is_coming_soon = formData.get("is_coming_soon") === "true";
    const imageFile = formData.get("image") as File;
    const existingUrl = formData.get("existingImageUrl") as string;

    let imageUrl = existingUrl || "";
    if (imageFile && imageFile.size > 0) {
      const uploaded = await uploadCityImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    const { error } = await supabaseAdmin
      .from("cities")
      .insert([{ name, image: imageUrl, is_featured, is_coming_soon }]);

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/explore");
    return { success: true };
  } catch (err: any) {
    console.error("Error adding city:", err);
    return { error: err.message || "Failed to add city." };
  }
}

export async function updateCity(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const is_featured = formData.get("is_featured") === "true";
    const is_coming_soon = formData.get("is_coming_soon") === "true";
    const imageFile = formData.get("image") as File;
    const existingUrl = formData.get("existingImageUrl") as string;

    let imageUrl = existingUrl || "";
    if (imageFile && imageFile.size > 0) {
      const uploaded = await uploadCityImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    const { error } = await supabaseAdmin
      .from("cities")
      .update({ name, image: imageUrl, is_featured, is_coming_soon })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/explore");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating city:", err);
    return { error: err.message || "Failed to update city." };
  }
}

export async function deleteCity(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("cities")
      .delete()
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/explore");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting city:", err);
    return { error: err.message || "Failed to delete city." };
  }
}
