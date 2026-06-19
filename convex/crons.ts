import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run automations every hour (can be adjusted later to be more frequent if needed)
crons.interval(
  "run cron automations",
  { hours: 1 },
  internal.automations.internalRunCronAutomations
);

export default crons;
