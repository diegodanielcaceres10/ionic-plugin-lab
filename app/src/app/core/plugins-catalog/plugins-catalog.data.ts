export interface PluginSeedEntry {
  name: string;
  category: string;
  icon: string;
  link?: string;
}

export const PLUGIN_CATALOG_SEED: PluginSeedEntry[] = [
  {
    name: 'Camera',
    category: 'Media & Scanning',
    icon: 'camera-outline',
    link: 'camera',
  },
  {
    name: 'Barcode Scanner',
    category: 'Media & Scanning',
    icon: 'barcode-outline',
    link: 'barcode-scanner',
  },
  {
    name: 'Geolocation',
    category: 'Location & Maps',
    icon: 'location-outline',
    link: 'geolocation',
  },
  {
    name: 'Background Geolocation',
    category: 'Location & Maps',
    icon: 'locate-outline',
  },
  { name: 'Google Maps', category: 'Location & Maps', icon: 'earth-outline' },
  {
    name: 'Device',
    category: 'Device & Sensors',
    icon: 'phone-portrait-outline',
    link: 'device',
  },
  {
    name: 'Haptics',
    category: 'Device & Sensors',
    icon: 'phone-portrait-outline',
    link: 'haptics',
  },
  {
    name: 'Network',
    category: 'Device & Sensors',
    icon: 'wifi-outline',
    link: 'network',
  },
  {
    name: 'Motion',
    category: 'Device & Sensors',
    icon: 'move-outline',
    link: 'motion',
  },
  {
    name: 'Filesystem',
    category: 'Storage & Files',
    icon: 'folder-outline',
    link: 'filesystem',
  },
  { name: 'Preferences', category: 'Storage & Files', icon: 'options-outline' },
  { name: 'SQLite', category: 'Storage & Files', icon: 'server-outline' },
  {
    name: 'File Picker',
    category: 'Storage & Files',
    icon: 'document-attach-outline',
  },
  {
    name: 'File Transfer',
    category: 'Storage & Files',
    icon: 'swap-vertical-outline',
  },
  { name: 'File Viewer', category: 'Storage & Files', icon: 'eye-outline' },
  {
    name: 'Cookies',
    category: 'Storage & Files',
    icon: 'file-tray-stacked-outline',
  },
  {
    name: 'StatusBar',
    category: 'UI & System Bars',
    icon: 'stats-chart-outline',
    link: 'status-bar',
  },
  {
    name: 'Browser',
    category: 'Web & Connectivity',
    icon: 'globe-outline',
    link: 'browser',
  },
  {
    name: 'InAppBrowser',
    category: 'Web & Connectivity',
    icon: 'open-outline',
  },
  {
    name: 'App Launcher',
    category: 'Web & Connectivity',
    icon: 'rocket-outline',
  },
  {
    name: 'Local Notifications',
    category: 'Notifications',
    icon: 'notifications-outline',
    link: 'local-notifications',
  },
  {
    name: 'Push Notifications',
    category: 'Notifications',
    icon: 'paper-plane-outline',
  },
  {
    name: 'Share',
    category: 'Sharing & Clipboard',
    icon: 'share-social-outline',
    link: 'share',
  },
  {
    name: 'Clipboard',
    category: 'Sharing & Clipboard',
    icon: 'clipboard-outline',
    link: 'clipboard',
  },
  {
    name: 'NFC',
    category: 'Wireless & Security',
    icon: 'radio-outline',
    link: 'nfc',
  },
  {
    name: 'Bluetooth LE',
    category: 'Wireless & Security',
    icon: 'bluetooth-outline',
    link: 'bluetooth',
  },
  {
    name: 'Biometrics',
    category: 'Wireless & Security',
    icon: 'finger-print-outline',
    link: 'biometrics',
  },
  { name: 'App', category: 'App Core', icon: 'apps-outline' },
];
