import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      gym_id,
      email,
      name,
      location,
      status,
      lat,
      lng,
      rating,
      reviews,
      has_offer,
      offer_percentage,
      description,
      image,
      gallery,
      amenities,
      plans
    } = body;

    let targetGymId = gym_id;

    // If gym_id not passed, find gym by partner email
    if (!targetGymId && email) {
      const cleanEmail = email.trim().toLowerCase();
      const gymRes = await query(`
        SELECT id FROM gyms 
        WHERE partner_id::text IN (
          SELECT id::text FROM users WHERE LOWER(email) = $1
          UNION
          SELECT id::text FROM partner_users WHERE LOWER(email) = $1
        )
        LIMIT 1
      `, [cleanEmail]);

      targetGymId = gymRes.rows[0]?.id;
    }

    if (!targetGymId) {
      return NextResponse.json(
        { success: false, error: "Gym ID or partner email is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Fetch current gym record
    const currentGymRes = await query("SELECT * FROM gyms WHERE id::text = $1::text", [targetGymId]);
    if (currentGymRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Gym not found." },
        { status: 404, headers: corsHeaders }
      );
    }

    const currentGym = currentGymRes.rows[0];

    const updatedName = name !== undefined ? name.trim() : currentGym.name;
    const updatedLocation = location !== undefined ? location.trim() : currentGym.location;
    const updatedStatus = status !== undefined ? status : currentGym.status;
    const updatedLat = lat !== undefined && lat !== "" ? parseFloat(lat) : currentGym.lat;
    const updatedLng = lng !== undefined && lng !== "" ? parseFloat(lng) : currentGym.lng;
    const updatedRating = rating !== undefined ? parseFloat(rating) : currentGym.rating;
    const updatedReviews = reviews !== undefined ? parseInt(reviews, 10) : currentGym.reviews;
    const updatedHasOffer = has_offer !== undefined ? Boolean(has_offer) : currentGym.has_offer;
    const updatedOfferPercentage = offer_percentage !== undefined ? parseFloat(offer_percentage) : currentGym.offer_percentage;
    const updatedDesc = description !== undefined ? description.trim() : currentGym.description;
    const updatedImage = image !== undefined && image !== "" ? image : currentGym.image;
    const updatedGallery = Array.isArray(gallery) ? gallery : currentGym.gallery;
    const updatedAmenities = Array.isArray(amenities) ? amenities : currentGym.amenities;

    // 2. Update gym in DB
    const updateRes = await query(`
      UPDATE gyms
      SET 
        name = $1,
        location = $2,
        status = $3,
        lat = $4,
        lng = $5,
        rating = $6,
        reviews = $7,
        has_offer = $8,
        offer_percentage = $9,
        description = $10,
        image = $11,
        gallery = $12,
        amenities = $13
      WHERE id::text = $14::text
      RETURNING *
    `, [
      updatedName,
      updatedLocation,
      updatedStatus,
      updatedLat,
      updatedLng,
      updatedRating,
      updatedReviews,
      updatedHasOffer,
      updatedOfferPercentage,
      updatedDesc,
      updatedImage,
      updatedGallery,
      updatedAmenities,
      targetGymId
    ]);

    const updatedGym = updateRes.rows[0];

    // 3. Update pricing plans if provided
    if (Array.isArray(plans) && plans.length > 0) {
      try {
        await query("DELETE FROM plans WHERE gym_id::text = $1::text", [targetGymId]);
        for (const plan of plans) {
          if (plan.name && plan.price !== undefined) {
            await query(`
              INSERT INTO plans (gym_id, name, price)
              VALUES ($1, $2, $3)
            `, [targetGymId, plan.name, plan.price.toString()]);
          }
        }
      } catch (planErr) {
        console.warn("Plans update warning:", planErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Gym profile updated successfully!",
        gym: updatedGym
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[Edit Gym API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update gym profile." },
      { status: 500, headers: corsHeaders }
    );
  }
}
