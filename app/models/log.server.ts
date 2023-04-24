import gqlReq, { getAuthenticationHeaders, gql } from "~/utils/gql.server";

export type Log = {
    ip: string,
    user: string,
    date: string,
    method: string,
    path: string,
    protocol: string,
    status: string,
    size: string,
}

export async function createLogs(logs: Array<Log>) {
    const { insert_logs: logResponse } = await gqlReq<{ insert_logs: Array<Log> }>(
        gql`
            mutation InsertLogs($objects: [logs_insert_input] = {}) {
                insert_logs(objects: $objects) {
                    affected_rows
                }
            }
        `,
        {
            objects: logs
        },
        await getAuthenticationHeaders(null, true),
    );
    
    return logResponse;
}

export async function fetchLogs(request : Request) {

    // Read Search Params
    const url = new URL(request.url)
    const user = url.searchParams.get('user') || undefined
    const code = url.searchParams.get('code')
    const status = code ? Number(code) : undefined
    const method = url.searchParams.get('method') || undefined

    const { logs } = await gqlReq<{logs: Array<Log>}>(
        gql`
            query FetchLogs($status: Int_comparison_exp, $method: String_comparison_exp, $user: String_comparison_exp) {
                logs(where: { status: $status, method: $method, user: $user }, order_by: {date: desc}) {
                    ip
                    user
                    date
                    method
                    path
                    protocol
                    status
                    size
                }
            }          
        `,
        {
            status: status ? {_eq: status} : {},
            method: method ? {_eq: method} : {},
            user: user ? {_eq: user} : {},
        },
        await getAuthenticationHeaders(null, true),
    )

    return logs;
}