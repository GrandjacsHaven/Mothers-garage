"use client"

import React, { useCallback, useEffect, useRef, useState, useId } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Search, LocateFixed } from "lucide-react"

export interface InlineLocationPickerProps {
  onLocationSelected: (location: {
    lat: number
    lng: number
    address: string
    city?: string
    state?: string
  }) => void
  initialLocation?: { lat: number; lng: number; address: string } | null
}

// Default export is used here so that a dynamic import doesn’t need to reference a named export.
export default function InlineLocationPicker({
  onLocationSelected,
  initialLocation = null,
}: InlineLocationPickerProps) {
  const uniqueId = useId()
  const mapContainerId = `inline-map-container-${uniqueId}`

  const [address, setAddress] = useState(initialLocation?.address || "")
  const [latitude, setLatitude] = useState(initialLocation ? initialLocation.lat.toFixed(6) : "")
  const [longitude, setLongitude] = useState(initialLocation ? initialLocation.lng.toFixed(6) : "")
  const [searchQuery, setSearchQuery] = useState("")

  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const isMountedRef = useRef(true)

  // Configure Leaflet default icons
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      markerRef.current = null
    }
  }, [])

  const updateLocation = useCallback(
    async (lat: number, lng: number) => {
      setLatitude(lat.toFixed(6))
      setLongitude(lng.toFixed(6))
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        )
        const data = await res.json()
        const displayName =
          data.display_name || `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`
        const city =
          data?.address?.city ||
          data?.address?.town ||
          data?.address?.village ||
          ""
        const state = data?.address?.state || ""
        if (isMountedRef.current) {
          setAddress(displayName)
          onLocationSelected({ lat, lng, address: displayName, city, state })
        }
      } catch {
        const fallback = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`
        if (isMountedRef.current) {
          setAddress(fallback)
          onLocationSelected({ lat, lng, address: fallback })
        }
      }
    },
    [onLocationSelected]
  )

  const updateMarker = useCallback(
    (lat: number, lng: number) => {
      if (!mapRef.current) return
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current)
      }
      const marker = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current)
      marker.on("dragend", () => {
        const pos = marker.getLatLng()
        updateLocation(pos.lat, pos.lng)
      })
      markerRef.current = marker
    },
    [updateLocation]
  )

  const initializeMap = useCallback(() => {
    if (mapRef.current) return

    const container = document.getElementById(mapContainerId) as (HTMLElement & {
      _leaflet_id?: number
    }) | null
    if (container && container._leaflet_id) delete container._leaflet_id

    const map = L.map(mapContainerId, {
      center: [0, 0],
      zoom: 2,
      scrollWheelZoom: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    map.on("click", (e: L.LeafletMouseEvent) => {
      updateMarker(e.latlng.lat, e.latlng.lng)
      updateLocation(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map

    map.whenReady(() => {
      setTimeout(() => {
        if (!mapRef.current) return
        if (initialLocation) {
          mapRef.current.setView([initialLocation.lat, initialLocation.lng], 13)
          updateMarker(initialLocation.lat, initialLocation.lng)
          updateLocation(initialLocation.lat, initialLocation.lng)
        } else {
          const defaultLat = 1.3733
          const defaultLng = 32.2903
          mapRef.current.setView([defaultLat, defaultLng], 7)
        }
      }, 250)
    })
  }, [mapContainerId, initialLocation, updateMarker, updateLocation])

  useEffect(() => {
    initializeMap()
  }, [initializeMap])

  const searchAddress = async () => {
    if (!searchQuery.trim() || !mapRef.current) return
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`,
        { headers: { "Accept-Language": "en" } }
      )
      const data = await res.json()
      if (data && data.length > 0) {
        const place = data[0]
        const lat = parseFloat(place.lat)
        const lng = parseFloat(place.lon)
        mapRef.current.setView([lat, lng], 13)
        updateMarker(lat, lng)
        updateLocation(lat, lng)
      }
    } catch (err) {
      console.error("Address search error:", err)
    }
  }

  const handleCoordinateChange = () => {
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
      mapRef.current.setView([lat, lng], 13)
      updateMarker(lat, lng)
      updateLocation(lat, lng)
    }
  }

  const handleCurrentLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (!mapRef.current) return
          mapRef.current.setView([coords.latitude, coords.longitude], 13)
          updateMarker(coords.latitude, coords.longitude)
          updateLocation(coords.latitude, coords.longitude)
        },
        (error) => {
          console.error("Geolocation error:", error)
          alert("Could not access your location. Please check your browser permissions.")
          if (!mapRef.current) return
          const fallbackLat = 1.3733
          const fallbackLng = 32.2903
          mapRef.current.setView([fallbackLat, fallbackLng], 7)
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )
    } else {
      alert("Geolocation is not supported by your browser")
    }
  }

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <MapPin className="h-6 w-6 text-[#FF00E1] mr-2" />
          <h3 className="text-lg font-semibold">Your Location</h3>
        </div>
        <div>
          <Button variant="ghost" onClick={handleCurrentLocationClick}>
            <LocateFixed className="w-4 h-4 mr-1" />
            Use Current Location
          </Button>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter address to search..."
          onKeyDown={(e) => e.key === "Enter" && searchAddress()}
        />
        <Button variant="outline" onClick={searchAddress}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div
        id={mapContainerId}
        className="h-[300px] w-full rounded-md border bg-gray-100"
        style={{ height: "300px" }}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            onBlur={handleCoordinateChange}
            placeholder="Enter latitude"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            onBlur={handleCoordinateChange}
            placeholder="Enter longitude"
          />
        </div>
      </div>

      {address && <p className="text-sm text-muted-foreground">📍 {address}</p>}
    </div>
  )
}
