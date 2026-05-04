// types
import { DefaultConfigProps, MenuOrientation, ThemeDirection, ThemeMode } from 'types/config';

// ==============================|| THEME CONSTANT  ||============================== //

export const twitterColor = '#1DA1F2';
export const facebookColor = '#3b5998';
export const linkedInColor = '#0e76a8';

export const APP_DEFAULT_PATH = '/chats';
export const HORIZONTAL_MAX_ITEM = 6;
export const DRAWER_WIDTH = 160;

// ==============================|| THEME CONFIG  ||============================== //

const config: DefaultConfigProps = {
  fontFamily: `'Public Sans', sans-serif`,
  i18n: 'en',
  menuOrientation: MenuOrientation.VERTICAL,
  miniDrawer: false,
  container: true,
  mode: ThemeMode.LIGHT,
  presetColor: 'theme7',
  themeDirection: ThemeDirection.LTR
};


export const whatsapp_language = [
  { label: "English (US)", value: "en_US" },
  { label: "English (UK)", value: "en_GB" },
  { label: "Hindi", value: "hi_IN" },
  { label: "Arabic", value: "ar" },
  { label: "Bengali", value: "bn" },
  { label: "Gujarati", value: "gu" },
  { label: "Kannada", value: "kn" },
  { label: "Malayalam", value: "ml" },
  { label: "Marathi", value: "mr" },
  { label: "Punjabi", value: "pa" },
  { label: "Tamil", value: "ta" },
  { label: "Telugu", value: "te" },
  { label: "Urdu", value: "ur" },
  { label: "Spanish", value: "es" },
  { label: "Spanish (Mexico)", value: "es_MX" },
  { label: "Portuguese (Brazil)", value: "pt_BR" },
  { label: "Portuguese (Portugal)", value: "pt_PT" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Italian", value: "it" },
  { label: "Indonesian", value: "id" },
  { label: "Turkish", value: "tr" },
  { label: "Vietnamese", value: "vi" },
  { label: "Thai", value: "th" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Chinese (Simplified)", value: "zh_CN" },
  { label: "Chinese (Traditional)", value: "zh_TW" },
];

export default config;
