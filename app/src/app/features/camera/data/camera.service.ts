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
  mock: boolean;
}

@Injectable({ providedIn: 'root' })
export class CameraService {
  private platformService = inject(PlatformService);
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  /**
   * Single entry point to take a photo. The page doesn't need to know
   * whether it's running on browser or native: it always calls takePhoto()
   */
  async takePhoto(): Promise<PhotoInfo> {
    return this.takeNativePhoto(CameraSource.Camera);
  }

  /**
   * Opens the native gallery/photo picker to select an existing image.
   */
  async pickFromGallery(): Promise<PhotoInfo> {
    return this.takeNativePhoto(CameraSource.Photos);
  }

  // ---------------------------------------------------------------
  // Native
  // ---------------------------------------------------------------

  /**
   * Requests permissions, opens the native camera/gallery, and reads back
   * the resulting photo's real dimensions and file size.
   */
  private async takeNativePhoto(source: CameraSource): Promise<PhotoInfo> {
    try {
      if (!this.platformService.isNativePlatform()) {
        await this.saveLog(source, 'Photo simulated', 'warning');
        return {
          webPath: 'assets/mock/sample-photo.jpg',
          format: 'JPEG',
          width: 4032,
          height: 3024,
          fileSizeLabel: '2.48 MB',
          filePath: 'file://.../IMG_20260803_1234.jpg',
          savedLabel: 'Just now',
          mock: true,
        };
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
      await this.saveLog(
        source,
        source === CameraSource.Camera
          ? 'Photo captured'
          : source === CameraSource.Photos
            ? 'Photo selected from gallery'
            : 'Unknown',
        'success',
      );

      return {
        webPath: photo.webPath,
        format: (photo.format ?? 'jpeg').toUpperCase(),
        width: dimensions?.width,
        height: dimensions?.height,
        fileSizeLabel,
        filePath: photo.path ?? photo.webPath,
        savedLabel: 'Just now',
        mock: false,
      };
    } catch (error) {
      await this.saveLog(
        source,
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /** Writes the activity log entry and, on success, marks Camera as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'Camera',
      type:
        type === CameraSource.Camera
          ? 'Camera'
          : type === CameraSource.Photos
            ? 'Gallery'
            : 'Unknown',
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('Camera');
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
}
