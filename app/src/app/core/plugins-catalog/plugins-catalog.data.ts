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
    pluginType: 'community',
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
    pluginType: 'community',
  },
  {
    name: 'Google Maps',
    category: 'Location & Maps',
    icon: 'earth-outline',
    pluginType: 'official',
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
    pluginType: 'official',
  },
  {
    name: 'File Picker',
    category: 'Storage & Files',
    icon: 'document-attach-outline',
    pluginType: 'community',
  },
  {
    name: 'File Transfer',
    category: 'Storage & Files',
    icon: 'swap-vertical-outline',
    pluginType: 'community',
  },
  {
    name: 'File Viewer',
    category: 'Storage & Files',
    icon: 'eye-outline',
    pluginType: 'community',
  },
  {
    name: 'Cookies',
    category: 'Storage & Files',
    icon: 'file-tray-stacked-outline',
    pluginType: 'community',
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
    pluginType: 'community',
  },
  {
    name: 'App Launcher',
    category: 'Web & Connectivity',
    icon: 'rocket-outline',
    pluginType: 'official',
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
    pluginType: 'official',
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
    pluginType: 'community',
  },
  {
    name: 'Bluetooth LE',
    category: 'Wireless & Security',
    icon: 'bluetooth-outline',
    link: 'bluetooth',
    pluginType: 'community',
  },
  {
    name: 'Biometrics',
    category: 'Wireless & Security',
    icon: 'finger-print-outline',
    link: 'biometrics',
    pluginType: 'community',
  },
  {
    name: 'App',
    category: 'App Core',
    icon: 'apps-outline',
    pluginType: 'official',
  },
];
