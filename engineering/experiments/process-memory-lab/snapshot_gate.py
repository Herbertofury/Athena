"""Shared unchanged validity rules for Linux memory observations."""
FIELDS=('status_rss_bytes','status_high_water_rss_bytes','rollup_rss_bytes','rollup_pss_bytes','rollup_private_clean_bytes','rollup_private_dirty_bytes')
def validate_snapshot(values):
 if not isinstance(values,dict):raise ValueError('Missing memory phase')
 for name in FIELDS:
  if type(values.get(name)) is not int or values[name]<0:raise ValueError('Invalid memory value')
 if not values['status_rss_bytes'] or not values['status_high_water_rss_bytes'] or not values['rollup_rss_bytes']:raise ValueError('Unavailable resident memory')
 return values
