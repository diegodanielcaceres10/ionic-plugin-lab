import { inject, Injectable } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';
import { PlatformService } from '../../../core/platform/platform.service';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

export interface PhotoInfo {
  /** URL usable in an <img> (webPath on native, or the mock asset on browser) */
  webPath: string;
  format: string;
  width?: number;
  height?: number;
  fileSizeLabel?: string;
  filePath?: string;
  savedLabel: string;
}

/**
 * Thrown when running in the browser and the caller should
 * show the "try this on a mobile device" notice.
 */
export class BrowserNotSupportedError extends Error {
  constructor() {
    super('The Camera plugin cannot be tested in the browser.');
    this.name = 'BrowserNotSupportedError';
  }
}

@Injectable({ providedIn: 'root' })
export class CameraService {
  private platformService = inject(PlatformService);
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  /**
   * Single entry point to take a photo. The page doesn't need to know
   * whether it's running on browser or native: it always calls takePhoto()
   * and handles either the result or a BrowserNotSupportedError.
   */
  async takePhoto(): Promise<PhotoInfo> {
    return this.takeNativePhoto(CameraSource.Camera, 'photo');
  }

  /**
   * Opens the native gallery/photo picker to select an existing image.
   */
  async pickFromGallery(): Promise<PhotoInfo> {
    return this.takeNativePhoto(CameraSource.Photos, 'gallery');
  }

  // ---------------------------------------------------------------
  // Native
  // ---------------------------------------------------------------

  /**
   * Requests permissions, opens the native camera/gallery, and reads back
   * the resulting photo's real dimensions and file size.
   */
  private async takeNativePhoto(
    source: CameraSource,
    type: 'photo' | 'gallery',
  ): Promise<PhotoInfo> {
    try {
      if (!this.platformService.isNativePlatform()) {
        // On browser we don't attempt to open anything: we throw right away
        // and let the page decide how to show the alert.
        throw new BrowserNotSupportedError();
      }
      await this.ensurePermissions();

      const photo: Photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source,
      });

      if (!photo.webPath) {
        throw new Error('Could not retrieve the captured photo.');
      }

      const [dimensions, fileSizeLabel] = await Promise.all([
        this.readDimensions(photo.webPath),
        this.readFileSizeLabel(photo.webPath),
      ]);

      await this.logResult(type, 'success');

      return {
        webPath: photo.webPath,
        format: (photo.format ?? 'jpeg').toUpperCase(),
        width: dimensions?.width,
        height: dimensions?.height,
        fileSizeLabel,
        filePath: photo.path ?? photo.webPath,
        savedLabel: 'Just now',
      };
    } catch (error) {
      await this.logResult(type, 'error');
      throw error;
    }
  }

  /** Writes the activity log entry and, on success, marks Camera as tested/recently used. */
  private async logResult(
    type: 'photo' | 'gallery',
    status: 'success' | 'error',
  ): Promise<void> {
    await this.pluginLogsService.add({ plugin: 'Camera', type, status });
    if (status === 'success') {
      await this.pluginsCatalogService.recordUsage('Camera');
    }
  }

  /** Explicitly requests camera and gallery permissions before opening either. */
  private async ensurePermissions(): Promise<void> {
    const status = await Camera.checkPermissions();

    const needsCamera =
      status.camera !== 'granted' && status.camera !== 'limited';
    const needsPhotos =
      status.photos !== 'granted' && status.photos !== 'limited';

    if (needsCamera || needsPhotos) {
      const requested = await Camera.requestPermissions({
        permissions: ['camera', 'photos'],
      });

      const cameraOk =
        requested.camera === 'granted' || requested.camera === 'limited';
      const photosOk =
        requested.photos === 'granted' || requested.photos === 'limited';

      if (!cameraOk || !photosOk) {
        throw new Error('PERMISSION_DENIED');
      }
    }
  }

  /** Reads the real width/height by loading the image in an off-DOM <img>. */
  private readDimensions(
    src: string,
  ): Promise<{ width: number; height: number } | undefined> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(undefined);
      img.src = src;
    });
  }

  /** Reads the real file size by fetching the blob at its webPath. */
  private async readFileSizeLabel(src: string): Promise<string | undefined> {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const mb = blob.size / (1024 * 1024);
      return `${mb.toFixed(2)} MB`;
    } catch {
      return undefined;
    }
  }

  /** Fixed sample data used to preview the full flow on browser */
  getMockPhoto(): PhotoInfo {
    return {
      webPath: 'assets/mock/sample-photo.jpg',
      format: 'JPEG',
      width: 4032,
      height: 3024,
      fileSizeLabel: '2.48 MB',
      filePath: 'file://.../IMG_20260803_1234.jpg',
      savedLabel: 'Just now',
    };
  }
}
