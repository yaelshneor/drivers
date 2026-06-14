export const CONFLICT = {
  driverId: 'הנהג בעל מזהה כזה קיים',
  vehicleLicense: 'כלי תחבורה עם מספר רישוי כזה כבר קיים',
  route: 'מסלול עם מזהה כזה כבר קיים במערכת',
  trip: 'נסיעה עם מזהה כזה כבר קיימת במערכת',
} as const;

export function duplicateErrorResponse(err: unknown, message: string) {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: string }).code)
      : '';
  if (code !== '23505') return null;
  return { status: 409 as const, error: message };
}
