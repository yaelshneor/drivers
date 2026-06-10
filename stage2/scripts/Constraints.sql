ALTER TABLE bus ADD CONSTRAINT bus_capacity_chk CHECK (capacity >= 1 AND capacity <= 200);

ALTER TABLE route ADD CONSTRAINT route_duration_chk CHECK (estimatedduration >= 1 AND estimatedduration <= 3000);

ALTER TABLE bus ADD CONSTRAINT bus_licenseplate_unique UNIQUE (licenseplate);
