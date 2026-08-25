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

    // Sync to gyms_extra table for 100% consistency across all web dashboards
    try {
      await query(`
        INSERT INTO gyms_extra (gym_id, commission_rate, partner_referral_amount, lat, lng, rating, reviews, has_offer, offer_percentage, gallery, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        ON CONFLICT (gym_id) DO UPDATE SET
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          rating = EXCLUDED.rating,
          reviews = EXCLUDED.reviews,
          has_offer = EXCLUDED.has_offer,
          offer_percentage = EXCLUDED.offer_percentage,
          gallery = EXCLUDED.gallery,
          updated_at = CURRENT_TIMESTAMP
      `, [
        targetGymId,
        currentGym.commission_rate || 10,
        currentGym.partner_referral_amount || 100,
        updatedLat,
        updatedLng,
        updatedRating,
        updatedReviews,
        updatedHasOffer,
        updatedOfferPercentage,
        updatedGallery
      ]);
    } catch (extraErr) {
      console.warn("gyms_extra sync warning:", extraErr);
    }

    // 3. Update pricing plans if provided
    if (Array.isArray(plans)) {
      try {
        await query("DELETE FROM pricing_plans WHERE gym_id::text = $1::text", [targetGymId]);
        for (let i = 0; i < plans.length; i++) {
          const plan = plans[i];
          if (plan && plan.name && plan.price !== undefined && plan.price !== "") {
            const cleanPrice = plan.price.toString().replace(/[^0-9.]/g, '');
            const displayPrice = cleanPrice ? `₹${cleanPrice}` : '₹0';
            await query(`
              INSERT INTO pricing_plans (gym_id, name, price, features, button_text, popular)
              VALUES ($1, $2, $3, $4, 'Book Now', $5)
            `, [targetGymId, plan.name.trim(), displayPrice, ["Access to Gym", "Locker Access", "Basic Amenities"], i === 2]);
          }
        }
      } catch (planErr) {
        console.warn("Pricing plans update warning:", planErr);
      }
    }

    // Fetch refreshed pricing plans to return
    try {
      const refreshedPlans = await query("SELECT * FROM pricing_plans WHERE gym_id::text = $1::text ORDER BY price ASC", [targetGymId]);
      updatedGym.plans = refreshedPlans.rows || [];
    } catch (_) {
      updatedGym.plans = [];
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
