import { Injectable } from '@angular/core';
import * as L from 'leaflet';

// Leaflet's default marker icons reference relative image paths that break
// once bundled by Angular's build. Pointing them at the CDN avoids extra
// asset-copying configuration just for two small PNGs.
const DEFAULT_ICON = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * Wraps Leaflet so the page/component never touches the map library
 * directly. Keeps a single map instance alive between position updates.
 */
@Injectable({ providedIn: 'root' })
export class MapService {
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private accuracyCircle: L.Circle | null = null;

  get isMounted(): boolean {
    return this.map !== null;
  }

  /**
   * Creates the Leaflet map centered on the given position. The element
   * with `elementId` must already exist in the DOM when this is called.
   */
  init(
    elementId: string,
    latitude: number,
    longitude: number,
    zoom = 17,
  ): void {
    this.map = L.map(elementId, { zoomControl: true }).setView(
      [latitude, longitude],
      zoom,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.marker = L.marker([latitude, longitude], { icon: DEFAULT_ICON }).addTo(
      this.map,
    );
  }

  /**
   * Moves the marker (and accuracy circle, if provided) to a new position,
   * optionally re-centering the map on it — used to "follow" the user
   * while a watch is active.
   */
  updatePosition(
    latitude: number,
    longitude: number,
    accuracy?: number,
    recenter = true,
  ): void {
    if (!this.map || !this.marker) {
      return;
    }

    const latLng = L.latLng(latitude, longitude);
    this.marker.setLatLng(latLng);

    if (accuracy) {
      if (!this.accuracyCircle) {
        this.accuracyCircle = L.circle(latLng, {
          radius: accuracy,
          color: '#3880ff',
          fillColor: '#3880ff',
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(this.map);
      } else {
        this.accuracyCircle.setLatLng(latLng);
        this.accuracyCircle.setRadius(accuracy);
      }
    }

    if (recenter) {
      this.map.panTo(latLng);
    }
  }

  /** Forces Leaflet to recalculate the container size, e.g. if the card resizes. */
  invalidateSize(): void {
    this.map?.invalidateSize();
  }

  /** Destroys the map instance and clears references. Call when leaving the page. */
  destroy(): void {
    this.map?.remove();
    this.map = null;
    this.marker = null;
    this.accuracyCircle = null;
  }
}
