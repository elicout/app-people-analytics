import { RLS } from "@/lib/constants";

/**
 * Returns bound parameter arrays for the two RLS filter patterns.
 * Always derive userEmail from the server session — never from client input.
 * @param userEmail - The authenticated user's email from auth().
 */
export function buildRlsParams(userEmail: string) {
  return {
    /** CONTAINS(manager_chain, ?) AND email != ?
     *  Use for: employees, performance, attendance, productivity, overtime */
    employee: [userEmail, userEmail] as [string, string],
    /** CONTAINS(manager_chain, ?)
     *  Use for: turnover (includes the TL's own direct reports who departed) */
    turnover: [userEmail] as [string],
    column: RLS.COLUMN,
  };
}
