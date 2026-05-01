"use server";

import { query } from "@/lib/db";
import { gyms as mockGyms, cities as mockCities, pricingPlans as mockPricingPlans } from "@/data/mockData";

export async function getGyms() {
  try {
    const result = await query('SELECT * FROM gyms ORDER BY created_at DESC');
    return result.rows.length > 0 ? result.rows : mockGyms;
  } catch (error) {
    console.error('Error fetching gyms:', error);
    return mockGyms;
  }
}

export async function getGymById(id: string) {
  try {
    console.log("Fetching gym by ID:", id);
    const result = await query('SELECT * FROM gyms WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      console.log("Gym found in database:", result.rows[0].name);
      return result.rows[0];
    }
    
    console.log("Gym not found in database, checking mock data...");
    const mockGym = mockGyms.find(g => g.id === id);
    if (mockGym) {
      console.log("Gym found in mock data:", mockGym.name);
      return mockGym;
    }
    
    console.log("Gym not found anywhere for ID:", id);
    return null;
  } catch (error) {
    console.error('Error fetching gym by id:', error);
    return mockGyms.find(g => g.id === id) || null;
  }
}

export async function getCities() {
  try {
    const result = await query('SELECT * FROM cities ORDER BY created_at DESC');
    return result.rows.length > 0 ? result.rows : mockCities;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return mockCities;
  }
}

export async function getPricingPlans() {
  try {
    const result = await query('SELECT * FROM pricing_plans');
    return result.rows.length > 0 ? result.rows : mockPricingPlans;
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    return mockPricingPlans;
  }
}

export async function getPricingPlansByGymId(gymId: string) {
  try {
    const result = await query(
      'SELECT * FROM pricing_plans WHERE gym_id = $1 ORDER BY price ASC',
      [gymId]
    );
    return result.rows || [];
  } catch (error) {
    console.error('Error fetching plans by gym id:', error);
    return [];
  }
}