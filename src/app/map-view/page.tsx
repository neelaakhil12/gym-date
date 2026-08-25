"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface GymItem {
  id: string;
  name: string;
  pricePerDay: number;
  rating: number;
  latitude: number;
  longitude: number;
  location: string;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapContent() {
  const searchParams = useSearchParams();
  const [gyms, setGyms] = useState<GymItem[]>([]);
  const [loading, setLoading] = useState(true);

  const userLat = parseFloat(searchParams.get("lat") || "17.385044");
  const userLng = parseFloat(searchParams.get("lng") || "78.486671");
  const radiusParam = searchParams.get("radius") || "all";
  const radius = radiusParam === "all" ? 99999 : parseFloat(radiusParam);

  useEffect(() => {
    // Fetch live gyms from API
    fetch("/api/gyms")
      .then((res) => res.json())
      .then((data) => {
        const rawList = Array.isArray(data) ? data : (data.gyms || []);
        if (Array.isArray(rawList)) {
          const mapped: GymItem[] = rawList.map((g: any, idx: number) => {
            let lat = parseFloat(g.latitude || g.lat) || (g.coordinates?.lat ? parseFloat(g.coordinates.lat) : 0);
            let lng = parseFloat(g.longitude || g.lng) || (g.coordinates?.lng ? parseFloat(g.coordinates.lng) : 0);

            if (!lat || !lng) {
              lat = userLat + (idx % 2 === 0 ? 1 : -1) * (0.008 + idx * 0.006);
              lng = userLng + (idx % 3 === 0 ? 1 : -1) * (0.008 + idx * 0.005);
            }

            return {
              id: String(g.id),
              name: g.name || "Gym",
              pricePerDay: Number(g.price_per_day || g.pricePerDay || 299),
              rating: Number(g.rating || 4.8),
              latitude: lat,
              longitude: lng,
              location: g.location || g.address || "Hyderabad",
            };
          });
          setGyms(mapped);
        }
      })
      .catch((err) => console.error("Error loading gyms for map:", err))
      .finally(() => setLoading(false));
  }, [userLat, userLng]);

  useEffect(() => {
    if (loading || typeof window === "undefined") return;

    function initMap() {
      const L = (window as any).L;
      if (!L) return;

      const container = document.getElementById("map");
      if (!container) return;

      // Clean up previous instance if any
      (container as any)._leaflet_id = null;
      container.innerHTML = "";

      // Initialize map without external link controls
      const map = L.map("map", { 
        zoomControl: true, 
        attributionControl: false,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,
      }).setView([userLat, userLng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Radius circle boundary if radius is set
      if (radius < 99999) {
        L.circle([userLat, userLng], {
          color: '#FF0000',
          fillColor: '#FF0000',
          fillOpacity: 0.05,
          weight: 2,
          dashArray: '6, 6',
          radius: radius * 1000,
        }).addTo(map);
      }

      // User location marker
      const userIcon = L.divIcon({
        className: "",
        html: '<div style="width:28px;height:28px;background:#FF0000;border:3px solid #fff;border-radius:50%;box-shadow:0 0 14px rgba(255,0,0,0.8);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;">🎯</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);

      // Filter gyms by radius
      const filtered = gyms.filter((g) => {
        const d = haversineKm(userLat, userLng, g.latitude, g.longitude);
        return d <= radius;
      });

      if (filtered.length === 0 && radius < 99999) {
        userMarker.bindPopup(
          `<div style="font-family:sans-serif;font-size:12px;text-align:center;padding:4px;"><b style="color:#0F172A;">📍 You are here</b><div style="color:#EF4444;font-size:11px;font-weight:700;margin-top:4px;">No gyms within ${radius} km.<br>Switch to 5km, 10km, or All!</div></div>`
        ).openPopup();
      } else {
        userMarker.bindPopup('<div style="font-family:sans-serif;font-size:12px;font-weight:700;color:#0F172A;text-align:center;">📍 Your Pinned Location</div>');
      }

      const allMarkers = [userMarker];

      filtered.forEach((g) => {
        const distKm = haversineKm(userLat, userLng, g.latitude, g.longitude).toFixed(1);
        const shortName = (g.name || "Gym").length > 16 ? (g.name || "Gym").substring(0, 14) + ".." : (g.name || "Gym");
        const gymIcon = L.divIcon({
          className: "",
          html: `<div style="background:#10B981;color:#fff;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:800;border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.25);white-space:nowrap;cursor:pointer;display:flex;align-items:center;gap:4px;">🏋️ ${shortName}</div>`,
          iconSize: [110, 28],
          iconAnchor: [55, 14],
        });

        const marker = L.marker([g.latitude, g.longitude], { icon: gymIcon }).addTo(map);

        const popupContent = `
          <div style="text-align:center;min-width:160px;font-family:sans-serif;padding:4px;">
            <div style="font-size:13px;font-weight:800;color:#0F172A;margin-bottom:2px;">${g.name}</div>
            <div style="font-size:11px;font-weight:700;color:#10B981;margin-bottom:4px;">${g.rating} ★ (${distKm} km away)</div>
            <button 
              id="gym-btn-${g.id}"
              style="background:#FF0000;color:#fff;border:none;padding:8px 14px;border-radius:10px;font-size:11px;font-weight:800;cursor:pointer;width:100%;"
            >
              View Passes & Gym →
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on("popupopen", () => {
          const btn = document.getElementById(`gym-btn-${g.id}`);
          if (btn) {
            btn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              if ((window as any).ReactNativeWebView?.postMessage) {
                (window as any).ReactNativeWebView.postMessage(
                  JSON.stringify({ type: "OPEN_GYM", id: g.id })
                );
              } else if (window.parent?.postMessage) {
                window.parent.postMessage({ type: "OPEN_GYM", id: g.id }, "*");
              }
            };
          }
        });

        allMarkers.push(marker);
      });

      if (allMarkers.length > 1) {
        const group = new L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.2));
      } else {
        map.setView([userLat, userLng], 14);
      }
    }

    // Ensure Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Ensure Leaflet JS
    if ((window as any).L) {
      initMap();
    } else {
      let script = document.getElementById("leaflet-js") as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else {
        script.addEventListener("load", initMap);
      }
    }

    return () => {};
  }, [loading, gyms, userLat, userLng, radius]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#f8fafc" }}>
      {loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.9)", zIndex: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#64748B" }}>Loading live map...</span>
        </div>
      )}
      <div id="map" style={{ width: "100%", height: "100%", minHeight: "380px", touchAction: "none" }} />
    </div>
  );
}

export default function MapViewPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", margin: 0, padding: 0 }}>
      <Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>Loading Map...</div>}>
        <MapContent />
      </Suspense>
    </div>
  );
}
