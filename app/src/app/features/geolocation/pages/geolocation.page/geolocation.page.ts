import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Geolocation, Position } from '@capacitor/geolocation';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { IonSpinner, IonButton, IonIcon } from '@ionic/angular/standalone';
import { ActionSheetController } from '@ionic/angular';

/** View model for the position data rendered in the template. */
interface PositionVM {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

type PageState = 'idle' | 'loading' | 'obtained' | 'error';

/**
 * Geolocation plugin demo page.
 *
 * Demonstrates `@capacitor/geolocation` with a one-shot lookup
 * (`getCurrentPosition`) and a continuous mode (`watchPosition`),
 * rendering the result on a Leaflet map plus a details panel.
 */
@Component({
  selector: 'app-geolocation',
  standalone: true,
  imports: [
    DecimalPipe,
    ShellComponent,
    HeaderComponent,
    IonSpinner,
    IonButton,
    IonIcon,
  ],
  templateUrl: './geolocation.page.html',
  styleUrls: ['./geolocation.page.scss'],
})
export class GeolocationPage implements AfterViewChecked, OnDestroy {
  @ViewChild('mapEl') mapEl?: ElementRef<HTMLDivElement>;

  private actionSheetCtrl = inject(ActionSheetController);

  state = signal<PageState>('idle');
  position = signal<PositionVM | null>(null);
  address = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  watching = signal(false);

  private watchId: string | null = null;
  private map: any = null;
  private marker: any = null;
  private accuracyCircle: any = null;
  private mapInitializing = false;

  /** Human-readable timestamp for the last known position. */
  timestampLabel = computed(() => {
    const p = this.position();
    if (!p) return '—';
    return new Date(p.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  });

  ngAfterViewChecked() {
    // #mapEl only exists in the DOM once state() === 'obtained'.
    // As soon as it appears, initialize Leaflet exactly once, regardless
    // of whether we got here via getCurrentLocation() or watchPosition().
    if (this.mapEl && !this.map && !this.mapInitializing) {
      this.mapInitializing = true;
      this.openMap().finally(() => (this.mapInitializing = false));
    }
  }

  /**
   * Creates the Leaflet map instance on #mapEl.
   * Centers on the current position if one is already known,
   * otherwise falls back to a low-zoom world view.
   */
  private async openMap() {
    const L = await import('leaflet');
    const current = this.position();
    const center: [number, number] = current
      ? [current.latitude, current.longitude]
      : [0, 0];

    this.map = L.map(this.mapEl!.nativeElement, {
      zoomControl: false,
      attributionControl: false,
    }).setView(center, current ? 16 : 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
      this.map,
    );

    if (current) {
      await this.updateMap(
        current.latitude,
        current.longitude,
        current.accuracy,
      );
    }
  }

  /** Recenters the map and redraws the marker + accuracy circle. */
  private async updateMap(lat: number, lng: number, accuracy: number) {
    if (!this.map) return;
    const L = await import('leaflet');
    this.map.setView([lat, lng], 16);

    if (this.marker) this.map.removeLayer(this.marker);
    if (this.accuracyCircle) this.map.removeLayer(this.accuracyCircle);

    this.accuracyCircle = L.circle([lat, lng], {
      radius: accuracy,
      color: '#6b5bd6',
      fillColor: '#6b5bd6',
      fillOpacity: 0.15,
      weight: 1,
    }).addTo(this.map);

    this.marker = L.circleMarker([lat, lng], {
      radius: 8,
      color: '#fff',
      weight: 2,
      fillColor: '#4640de',
      fillOpacity: 1,
    }).addTo(this.map);
  }

  /** One-shot location lookup, triggered by the "Get Current Location" button. */
  async getCurrentLocation() {
    this.state.set('loading');
    this.errorMessage.set(null);
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          throw { code: 1, message: 'denied' };
        }
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });

      await this.applyPosition(pos);
      await this.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      this.state.set('obtained');
    } catch (err: any) {
      this.errorMessage.set(this.mapError(err));
      this.state.set('error');
    }
  }

  /** Starts or stops the continuous position watch. */
  async toggleWatch() {
    if (this.watching()) {
      if (this.watchId) await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
      this.watching.set(false);
      return;
    }

    this.watching.set(true);
    this.watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 5000 },
      (pos, err) => {
        if (err) {
          this.errorMessage.set(this.mapError(err));
          this.state.set('error');
          return;
        }
        if (pos) {
          this.applyPosition(pos);
          this.state.set('obtained');
        }
      },
    );
  }

  /** Maps a Capacitor Position to the view model and updates the map, if it exists yet. */
  private async applyPosition(pos: Position) {
    const vm: PositionVM = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      speed: pos.coords.speed,
      heading: pos.coords.heading,
      timestamp: pos.timestamp,
    };
    this.position.set(vm);
    if (this.map) {
      await this.updateMap(vm.latitude, vm.longitude, vm.accuracy);
    }
  }

  /** Resolves a human-readable address for the given coordinates via BigDataCloud. */
  private async reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      );
      const data = await res.json();
      const parts = [data.locality, data.city, data.countryName].filter(
        Boolean,
      );
      this.address.set(parts.length ? parts.join(', ') : null);
    } catch {
      this.address.set(null);
    }
  }

  /** Translates a Capacitor Geolocation error into a user-facing message. */
  private mapError(err: any): string {
    if (err?.code === 1 || /denied/i.test(err?.message ?? '')) {
      return 'Location permission denied. Enable it in settings.';
    }
    if (err?.code === 3 || /timeout/i.test(err?.message ?? '')) {
      return 'Timed out waiting for a location fix.';
    }
    return 'Could not get your location. Make sure GPS is enabled.';
  }

  async copyCoordinates() {
    const p = this.position();
    if (!p) return;
    await navigator.clipboard.writeText(`${p.latitude}, ${p.longitude}`);
  }

  openInMaps() {
    const p = this.position();
    if (!p) return;
    window.open(
      `https://www.google.com/maps?q=${p.latitude},${p.longitude}`,
      '_blank',
    );
  }

  async openMenu() {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Geolocation',
      buttons: [
        { text: 'Copy coordinates', handler: () => this.copyCoordinates() },
        { text: 'Open in Google Maps', handler: () => this.openInMaps() },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async ngOnDestroy() {
    if (this.watchId) await Geolocation.clearWatch({ id: this.watchId });
  }
}
