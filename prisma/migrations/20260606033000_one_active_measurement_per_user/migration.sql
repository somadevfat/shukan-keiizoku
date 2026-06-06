CREATE UNIQUE INDEX "MeasurementSession_one_active_per_user"
ON "MeasurementSession" ("userId")
WHERE "stoppedAt" IS NULL AND "deletedAt" IS NULL;
