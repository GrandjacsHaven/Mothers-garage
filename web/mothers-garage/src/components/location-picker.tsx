"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface LocationPickerProps {
  onLocationSelected: (location: { lat: number; lng: number; address: string }) => void
  buttonLabel?: string
  dialogTitle?: string
  dialogDescription?: string
  initialLocation?: { lat: number; lng: number; address: string } | null
}

export function LocationPicker({
  onLocationSelected,
  buttonLabel,
  dialogTitle,
  dialogDescription,
  initialLocation = null,
}: LocationPickerProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [address, setAddress] = useState(initialLocation?.address || "")
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null,
  )
  const [manualLat, setManualLat] = useState(initialLocation?.lat.toString() || "")
  const [manualLng, setManualLng] = useState(initialLocation?.lng.toString() || "")

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const fetchAddressFromCoordinates = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } },
      )
      const data = await response.json()
      setAddress(data.display_name || `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`)
    } catch (error) {
      console.error("Error fetching address:", error)
      setAddress(`Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`)
    }
  }, [])

  const updateMarker = useCallback(
    (lat: number, lng: number, map: L.Map) => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
      }
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
      marker.on("dragend", () => {
        const pos = marker.getLatLng()
        setSelectedLocation({ lat: pos.lat, lng: pos.lng })
        setManualLat(pos.lat.toString())
        setManualLng(pos.lng.toString())
        fetchAddressFromCoordinates(pos.lat, pos.lng)
      })
      markerRef.current = marker
    },
    [fetchAddressFromCoordinates],
  )

  useEffect(() => {
    if (open && mapContainerRef.current && !mapRef.current) {
      const container = mapContainerRef.current as HTMLDivElement & { _leaflet_id?: number }
      if (container._leaflet_id) {
        delete container._leaflet_id
      }

      const map = L.map(container, { scrollWheelZoom: true }).setView([0, 0], 2)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      if (initialLocation) {
        map.setView([initialLocation.lat, initialLocation.lng], 13)
        updateMarker(initialLocation.lat, initialLocation.lng, map)
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            map.setView([coords.latitude, coords.longitude], 13)
            updateMarker(coords.latitude, coords.longitude, map)
            setSelectedLocation({ lat: coords.latitude, lng: coords.longitude })
            setManualLat(coords.latitude.toString())
            setManualLng(coords.longitude.toString())
            fetchAddressFromCoordinates(coords.latitude, coords.longitude)
          },
          () => {
            console.warn("Geolocation permission denied or unavailable")
          },
        )
      }

      map.on("click", (e: L.LeafletMouseEvent) => {
        updateMarker(e.latlng.lat, e.latlng.lng, map)
        setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
        setManualLat(e.latlng.lat.toString())
        setManualLng(e.latlng.lng.toString())
        fetchAddressFromCoordinates(e.latlng.lat, e.latlng.lng)
      })

      mapRef.current = map

      setTimeout(() => {
        map.invalidateSize()
      }, 250)
    }

    if (!open && mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [open, initialLocation, updateMarker, fetchAddressFromCoordinates])

  const searchAddress = async () => {
    if (!address.trim() || !mapRef.current) return
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
        { headers: { "Accept-Language": "en" } },
      )
      const data = await response.json()
      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        const latitudeNum = parseFloat(lat)
        const longitudeNum = parseFloat(lon)
        mapRef.current.setView([latitudeNum, longitudeNum], 13)
        updateMarker(latitudeNum, longitudeNum, mapRef.current)
        setSelectedLocation({ lat: latitudeNum, lng: longitudeNum })
        setManualLat(latitudeNum.toString())
        setManualLng(longitudeNum.toString())
        fetchAddressFromCoordinates(latitudeNum, longitudeNum)
      }
    } catch (error) {
      console.error("Error searching address:", error)
    }
  }

  const handleManualCoordinateChange = () => {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    if (isNaN(lat) || isNaN(lng) || !mapRef.current) return
    mapRef.current.setView([lat, lng], 13)
    updateMarker(lat, lng, mapRef.current)
    setSelectedLocation({ lat, lng })
    fetchAddressFromCoordinates(lat, lng)
  }

  const handlePinCurrentLocation = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          mapRef.current!.setView([coords.latitude, coords.longitude], 13)
          updateMarker(coords.latitude, coords.longitude, mapRef.current!)
          setSelectedLocation({ lat: coords.latitude, lng: coords.longitude })
          setManualLat(coords.latitude.toString())
          setManualLng(coords.longitude.toString())
          fetchAddressFromCoordinates(coords.latitude, coords.longitude)
        },
        (error) => {
          console.error("Error getting current location:", error)
        },
      )
    }
  }

  const handleSelectLocation = () => {
    if (selectedLocation) {
      onLocationSelected({ lat: selectedLocation.lat, lng: selectedLocation.lng, address })
      setOpen(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="flex-shrink-0">
        <MapPin className="mr-2 h-4 w-4" />
        {buttonLabel || t("common.pinLocation")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="text-[#FF00E1] mr-2">📍</span>
              {dialogTitle || "Your Location"}
            </DialogTitle>
            <DialogDescription>
              {dialogDescription || "Tap on the map to pin your location or enter coordinates manually"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button variant="secondary" onClick={handlePinCurrentLocation} className="w-full">
              <MapPin className="mr-2 h-4 w-4" />
              {t("motherOnboarding.location.pinLocationButton")}
            </Button>

            <div className="flex gap-2">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("motherOnboarding.location.searchPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && searchAddress()}
              />
              <Button variant="outline" onClick={searchAddress}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div ref={mapContainerRef} className="h-[300px] rounded-md border" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  onBlur={handleManualCoordinateChange}
                  placeholder="Enter latitude"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  onBlur={handleManualCoordinateChange}
                  placeholder="Enter longitude"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSelectLocation}
              className="bg-[#FF00E1] hover:bg-[#FF00E1]/90"
              disabled={!selectedLocation}
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
