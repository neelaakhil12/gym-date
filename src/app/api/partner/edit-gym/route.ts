import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      gym_id,
      email,
      name,
      location,
      lat,
      lng,
      description,
      rating,
      reviews,
      has_offer,
      offer_percentage,
      image,
      gallery,
      amenities,
      plans
    } = body;

    let targetGymId = gym_id;

    if (!targetGymId && email) {
      const userRes = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (userRes.rows.length > 0) {
        const userId = userRes.rows[0].id;
        const gymRes = await query('SELECT id FROM gyms WHERE owner_id::text = $1::text OR partner_id::text = $1::text', [userId]);
        if (gymRes.rows.length > 0) {
          targetGymId = gymRes.rows[0].id;
        }
      }
    }

    if (!targetGymId) {
      return NextResponse.json({ success: false, error: 'Target gym not found' }, { status: 400 });
    }

    const numLat = lat !== undefined && lat !== null && lat !== '' ? parseFloat(lat) : null;
    const numLng = lng !== undefined && lng !== null && lng !== '' ? parseFloat(lng) : null;
    const numRating = rating !== undefined && rating !== null && rating !== '' ? parseFloat(rating) : 4.5;
    const numReviews = reviews !== undefined && reviews !== null && reviews !== '' ? parseInt(reviews) : 0;
    const boolHasOffer = Boolean(has_offer);
    const numOfferPct = offer_percentage !== undefined && offer_percentage !== null && offer_percentage !== '' ? parseInt(offer_percentage) : 0;
    const amenitiesArr = Array.isArray(amenities) ? amenities : [];
    const galleryArr = Array.isArray(gallery) ? gallery : [];

    // 1. Update gyms table
    await query(
      `UPDATE gyms 
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           lat = $3,
           lng = $4,
           description = COALESCE($5, description),
           rating = $6,
           reviews = $7,
           has_offer = $8,
           offer_percentage = $9,
           image = COALESCE($10, image),
           gallery = $11,
           amenities = $12
       WHERE id::text = $13::text`,
      [
        name,
        location,
        numLat,
        numLng,
        description,
        numRating,
        numReviews,
        boolHasOffer,
        numOfferPct,
        image || null,
        galleryArr,
        amenitiesArr,
        targetGymId
      ]
    );

    // 2. Update Pricing Plans if provided
    if (Array.isArray(plans) && plans.length > 0) {
      // Clear existing plans for this gym and insert new ones
      await query('DELETE FROM plans WHERE gym_id::text = $1::text', [targetGymId]);
      for (const p of plans) {
        if (p && p.name && p.price) {
          const rawPrice = String(p.price).replace(/[^0-9.]/g, '');
          const formattedPrice = `₹${rawPrice || '0'}`;
          await query(
            `INSERT INTO plans (gym_id, name, price, popular) VALUES ($1, $2, $3, false)`,
            [targetGymId, p.name.trim(), formattedPrice]
          );
        }
      }
    }

    // 3. Fetch updated gym
    const updatedGymRes = await query('SELECT * FROM gyms WHERE id::text = $1::text', [targetGymId]);
    const updatedPlansRes = await query('SELECT * FROM plans WHERE gym_id::text = $1::text', [targetGymId]);

    return NextResponse.json({
      success: true,
      message: 'Gym details updated successfully!',
      gym: {
        ...updatedGymRes.rows[0],
        plans: updatedPlansRes.rows
      }
    });
  } catch (error: any) {
    console.error('Error updating gym profile:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
