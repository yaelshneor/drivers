CREATE INDEX idx_bus_busid ON public.bus (busid);

CREATE INDEX IF NOT EXISTS idx_trip_driverid ON trip (driverid);

CREATE INDEX IF NOT EXISTS idx_trip_routeid ON trip (routeid);
