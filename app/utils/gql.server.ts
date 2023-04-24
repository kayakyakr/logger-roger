import type { ClientError, Variables, RequestDocument } from "graphql-request";
import { GraphQLClient, gql } from "graphql-request";

export { gql };

export const client = new GraphQLClient(process.env.HASURA_URL!);

/**
 * Helper for adding authorization to your GraphQL calls. This way we get row level permissions
 * that change depending on user role.
 *
 * Sometimes you have a situation where you don't have an user to make the call with, that's why you have
 * the sudo param as an escape hatch.
 */
export async function getAuthenticationHeaders(
  user: null,
  sudo = false
): Promise<Record<string, string>> {
  let headers: Record<string, string> = {};

  if (sudo) {
    headers["x-hasura-admin-secret"] = process.env.HASURA_ADMIN_SECRET!;
  }

  return headers;
}

export default async function gqlReq<T = RequestDocument, Y = Variables>(
  query: string,
  variables: Y,
  optHeaders: Record<string, string> = {}
) {
  try {
    const response = await client.request<T, Y>(query, variables, optHeaders);

    return response;
  } catch (clientError) {
    const e = clientError as ClientError;

    if (e.response?.status === 404) {
      console.error(e);
      throw new Error("Tried to request an endpoint that does not exist");
    }

    if (e.message.includes("Authentication hook unauthorized")) {
      throw new Error("Token is unauthorized. Login again.");
    }

    throw clientError;
  }
}
