import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';

export interface PhotoInfo {
  /** URL utilizable en un <img> (webPath en nativo, o el asset mock en browser) */
  webPath: string;
  format: string;
  width?: number;
  height?: number;
  fileSizeLabel?: string;
  filePath?: string;
  savedLabel: string;
}

/**
 * Se lanza cuando estamos en browser y el consumidor debería
 * mostrar el aviso de "probá esto en un dispositivo móvil".
 */
export class BrowserNotSupportedError extends Error {
  constructor() {
    super('El plugin Camera no puede probarse en el navegador.');
    this.name = 'BrowserNotSupportedError';
  }
}

@Injectable({ providedIn: 'root' })
export class CameraService {
  /** true si corremos dentro de una app nativa (Android/iOS), false en browser */
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Punto de entrada único. La página no necesita saber si está en
   * browser o nativo: siempre llama a takePhoto() y maneja el resultado
   * o el BrowserNotSupportedError.
   */
  async takePhoto(): Promise<PhotoInfo> {
    if (!this.isNativePlatform()) {
      // En browser no intentamos abrir nada: directamente devolvemos
      // el mock y dejamos que la página muestre la alerta.
      throw new BrowserNotSupportedError();
    }
    return this.takeNativePhoto(CameraSource.Camera);
  }

  async pickFromGallery(): Promise<PhotoInfo> {
    if (!this.isNativePlatform()) {
      throw new BrowserNotSupportedError();
    }
    return this.takeNativePhoto(CameraSource.Photos);
  }

  /** Datos fijos de ejemplo para mostrar el flujo completo en browser */
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

  // ---------------------------------------------------------------
  // Nativo
  // ---------------------------------------------------------------

  private async takeNativePhoto(source: CameraSource): Promise<PhotoInfo> {
    await this.ensurePermissions();

    const photo: Photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Uri,
      source,
    });

    if (!photo.webPath) {
      throw new Error('No se pudo obtener la foto capturada.');
    }

    const [dimensions, fileSizeLabel] = await Promise.all([
      this.readDimensions(photo.webPath),
      this.readFileSizeLabel(photo.webPath),
    ]);

    return {
      webPath: photo.webPath,
      format: (photo.format ?? 'jpeg').toUpperCase(),
      width: dimensions?.width,
      height: dimensions?.height,
      fileSizeLabel,
      filePath: photo.path ?? photo.webPath,
      savedLabel: 'Just now',
    };
  }

  /** Pide permisos de cámara y galería explícitamente antes de abrir */
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

  /** Lee ancho/alto reales cargando la imagen en un <img> off-DOM */
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

  /** Lee el peso real del archivo pidiendo el blob por su webPath */
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
