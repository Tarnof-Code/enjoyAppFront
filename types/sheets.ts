import type { ImageSourcePropType } from 'react-native';

export interface GoogleSheetsValuesResponse {
  range?: string;
  majorDimension?: 'ROWS' | 'COLUMNS';
  values?: string[][];
}

export type GroupCode = 'CRABES' | 'REQUINS' | 'POULPES';

export type FetchListsGroupFilter =
  | 'General'
  | 'animators'
  | 'bedrooms'
  | GroupCode;

export interface ChildListItem {
  lastName: string;
  firstName: string;
  sex: string;
  birthDate: string;
  age: string;
  class: string;
  group: GroupCode | string;
  imageSrc?: ImageSourcePropType;
  room: string;
  birthday?: ImageSourcePropType;
  groupAnim: string;
  bedroomAnim: string;
}

export interface HealthSheetRow {
  name: string;
  group: GroupCode | string;
  imageSrc?: ImageSourcePropType;
  general?: string;
  meal?: string;
  morningMeds?: string;
  middayMeds?: string;
  eveningMeds?: string;
  ifNeededMeds?: string;
}

export interface UsefulNumber {
  label: string;
  name: string;
  number: string;
  comment: string;
}

export interface DaytimeActivity {
  date: string;
  group: string;
  anim: string;
  morning: string;
  afternoon: string;
  photo: ImageSourcePropType;
}

export interface EveningActivity {
  date: string;
  group: string;
  anim: string;
  activity: string;
  photo: ImageSourcePropType;
}

export interface Trip {
  date: string;
  group: string;
  anim: string;
  destination: string;
  photo: ImageSourcePropType;
}

export interface MealPlanning {
  date: string;
  group: string;
  ptitDej: string;
  dej: string;
  diner: string;
  photo: ImageSourcePropType;
}

export interface WakeUpSlot {
  date: string;
  group: string;
  anim: string;
  time: string;
  photo: ImageSourcePropType;
}

export interface SurveillanceSlot {
  date: string;
  group: string;
  anim: string;
  morning: string;
  afternoon: string;
  evening: string;
  photo: ImageSourcePropType;
}

export interface HolidayRow {
  date: string;
  group: string;
  anim: string;
  activity: string;
  photo: ImageSourcePropType;
}

export interface LaundryRow {
  date: string;
  group: string;
  anim: string;
  activity: string;
  photo: ImageSourcePropType;
}

export interface HomeInfoLine {
  text: string;
}

export type AnimName =
  | 'CANDICE'
  | 'BASTIEN'
  | 'CHRISTIAN'
  | 'DERRIEN'
  | 'EMY'
  | 'KHOUDEYI'
  | 'MAËVA'
  | 'NICOLAS'
  | 'ROMAIN'
  | 'RUDY'
  | 'SAMIR'
  | 'VANESSA'
  | 'TARNOF'
  | '';
