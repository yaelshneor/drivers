export const STAGE4_QUERY_META = {
  topRegionActivity: {
    id: 'stage4-function1',
    file: 'stage4/functions.sql',
    lines: '52-127',
    type: 'FUNCTION' as const,
    name: 'get_driver_top_region_activity',
    description: 'אזור הפעילות המוביל של נהג',
  },
  updateRouteStatistics: {
    id: 'stage4-procedure2',
    file: 'stage4/procedure.sql',
    lines: '83-137',
    type: 'PROCEDURE' as const,
    name: 'update_route_statistics',
    description: 'עדכון משך מסלולים לפי כמות נסיעות',
  },
  validateDriverTrigger: {
    id: 'stage4-trigger2',
    file: 'stage4/triggers.sql',
    lines: '28-53',
    type: 'TRIGGER' as const,
    name: 'trg_validate_driver',
    description: 'אימות קיום נהג לפני הוספת נסיעה',
  },
};
