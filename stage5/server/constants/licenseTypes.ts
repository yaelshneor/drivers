export const LICENSE_TYPES = [
  'רשיון לרכב פרטי',
  'רשיון לאוטובוס',
  'רכב מסחרי',
] as const;

export type LicenseType = (typeof LICENSE_TYPES)[number];

export function isValidLicenseType(value: string): value is LicenseType {
  return (LICENSE_TYPES as readonly string[]).includes(value);
}
