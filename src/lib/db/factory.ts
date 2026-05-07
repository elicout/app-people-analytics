import { mockRepositories } from "./mock";
import { realRepositories } from "./real";
import type { Repositories } from "./interfaces/types";

/**
 * Returns the repository set for the configured data source.
 * Reads DATA_SOURCE env var ("mock" | "real"); defaults to "mock".
 * Throws at call time if DATA_SOURCE is set to an invalid value.
 */
export function getRepositories(): Repositories {
  const source = process.env.DATA_SOURCE ?? "mock";
  if (source !== "mock" && source !== "real") {
    throw new Error(`Invalid DATA_SOURCE "${source}". Must be "mock" or "real".`);
  }
  return source === "real" ? realRepositories : mockRepositories;
}
