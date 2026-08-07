export interface PluginSeedEntry {
  name: string;
  category: string;
  icon: string;
  link?: string;
  pluginType: string;
}

export const PLUGIN_CATALOG_SEED: PluginSeedEntry[] = [
  {
    name: 'Camera',
    category: 'Media & Scanning',
    icon: 'camera-outline',
    link: 'camera',
    pluginType: 'official',
  },
  {
    name: 'Barcode Scanner',
    category: 'Media & Scanning',
    icon: 'barcode-outline',
    link: 'barcode-scanner',
    pluginType: 'community', // @capacitor-mlkit/barcode-scanning
  },
  {
    name: 'Geolocation',
    category: 'Location & Maps',
    icon: 'location-outline',
    link: 'geolocation',
    pluginType: 'official',
  },
  {
    name: 'Background Geolocation',
    category: 'Location & Maps',
    icon: 'locate-outline',
    link: 'background-geolocation',
    pluginType: 'community', // no está en tus deps aún (ej. @capacitor-community/background-geolocation)
  },
  {
    name: 'Google Maps',
    category: 'Location & Maps',
    icon: 'earth-outline',
    link: 'google-maps',
    pluginType: 'official', // @capacitor/google-maps; en package.json usás leaflet en su lugar
  },
  {
    name: 'Device',
    category: 'Device & Sensors',
    icon: 'phone-portrait-outline',
    link: 'device',
    pluginType: 'official',
  },
  {
    name: 'Haptics',
    category: 'Device & Sensors',
    icon: 'phone-portrait-outline',
    link: 'haptics',
    pluginType: 'official',
  },
  {
    name: 'Network',
    category: 'Device & Sensors',
    icon: 'wifi-outline',
    link: 'network',
    pluginType: 'official',
  },
  {
    name: 'Motion',
    category: 'Device & Sensors',
    icon: 'move-outline',
    link: 'motion',
    pluginType: 'official',
  },
  {
    name: 'Filesystem',
    category: 'Storage & Files',
    icon: 'folder-outline',
    link: 'filesystem',
    pluginType: 'official',
  },
  {
    name: 'Preferences',
    category: 'Storage & Files',
    icon: 'options-outline',
    link: 'preferences',
    pluginType: 'official', // @capacitor/preferences; no está en tus deps aún
  },
  {
    name: 'SQLite',
    category: 'Storage & Files',
    icon: 'server-outline',
    link: 'sqlite',
    pluginType: 'community', // @capacitor-community/sqlite
  },
  {
    name: 'File Picker',
    category: 'Storage & Files',
    icon: 'document-attach-outline',
    link: 'file-picker',
    pluginType: 'community', // no está en tus deps aún (ej. @capawesome/capacitor-file-picker)
  },
  {
    name: 'File Transfer',
    category: 'Storage & Files',
    icon: 'swap-vertical-outline',
    link: 'file-transfer',
    pluginType: 'community', // no está en tus deps aún
  },
  {
    name: 'File Viewer',
    category: 'Storage & Files',
    icon: 'eye-outline',
    link: 'file-viewer',
    pluginType: 'community', // no está en tus deps aún
  },
  {
    name: 'Cookies',
    category: 'Storage & Files',
    icon: 'file-tray-stacked-outline',
    link: 'cookies',
    pluginType: 'community', // no está en tus deps aún
  },
  {
    name: 'StatusBar',
    category: 'UI & System Bars',
    icon: 'stats-chart-outline',
    link: 'status-bar',
    pluginType: 'official',
  },
  {
    name: 'Browser',
    category: 'Web & Connectivity',
    icon: 'globe-outline',
    link: 'browser',
    pluginType: 'official',
  },
  {
    name: 'InAppBrowser',
    category: 'Web & Connectivity',
    icon: 'open-outline',
    link: 'in-app-browser',
    pluginType: 'community', // no está en tus deps aún
  },
  {
    name: 'App Launcher',
    category: 'Web & Connectivity',
    icon: 'rocket-outline',
    link: 'app-launcher',
    pluginType: 'official', // @capacitor/app-launcher; no está en tus deps aún
  },
  {
    name: 'Local Notifications',
    category: 'Notifications',
    icon: 'notifications-outline',
    link: 'local-notifications',
    pluginType: 'official',
  },
  {
    name: 'Push Notifications',
    category: 'Notifications',
    icon: 'paper-plane-outline',
    link: 'push-notifications',
    pluginType: 'official', // @capacitor/push-notifications; no está en tus deps aún
  },
  {
    name: 'Share',
    category: 'Sharing & Clipboard',
    icon: 'share-social-outline',
    link: 'share',
    pluginType: 'official',
  },
  {
    name: 'Clipboard',
    category: 'Sharing & Clipboard',
    icon: 'clipboard-outline',
    link: 'clipboard',
    pluginType: 'official',
  },
  {
    name: 'NFC',
    category: 'Wireless & Security',
    icon: 'radio-outline',
    link: 'nfc',
    pluginType: 'community', // @capgo/capacitor-nfc
  },
  {
    name: 'Bluetooth LE',
    category: 'Wireless & Security',
    icon: 'bluetooth-outline',
    link: 'bluetooth',
    pluginType: 'community', // @capacitor-community/bluetooth-le
  },
  {
    name: 'Biometrics',
    category: 'Wireless & Security',
    icon: 'finger-print-outline',
    link: 'biometrics',
    pluginType: 'community', // @aparajita/capacitor-biometric-auth
  },
  {
    name: 'App',
    category: 'App Core',
    icon: 'apps-outline',
    link: 'app',
    pluginType: 'official',
  },
];
