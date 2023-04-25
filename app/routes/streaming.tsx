import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import { LoaderArgs } from "@remix-run/server-runtime";
import { useEffect, useState } from "react";
import { Log, fetchLogs } from "~/models/log.server";
import { createClient } from "graphql-ws"
import { gql } from "graphql-request";
import fetchLogFromLoggerator from "./_index/fetchLog.server";

export async function action () {
    // triggers a loggerator load
    fetchLogFromLoggerator()
    
    return new Response("", {
        status: 200,
        statusText: "OK",
    })
}

export async function loader({ request } : LoaderArgs) {
    return {
        hasura_url: process.env.HASURA_WS_URL || '',
        logs: await fetchLogs(request)
    }
}

export function shouldRevalidate() { return false } // we are streaming changes, don't need to refresh

type LoaderType = Awaited<ReturnType<typeof loader>>;

export default function HomePage() {
    const { logs: initialLogs, hasura_url } = useLoaderData<LoaderType>()
    const [logs, setLogs] = useState(initialLogs)
    const [searchParams] = useSearchParams()
    const user = searchParams.get('user');
    const method = searchParams.get('method');
    const status = searchParams.get('code');

    useEffect(() => {
        // start up the client on page load
        const client = createClient({ url: hasura_url })

        client.subscribe({
                query: gql`
                    subscription MySubscription($status: Int_comparison_exp, $method: String_comparison_exp, $user: String_comparison_exp) {
                        logs(where: { status: $status, method: $method, user: $user }, order_by: {date: desc}) {
                            date
                            ip
                            method
                            path
                            protocol
                            size
                            status
                            user
                        }
                    }`,
                variables: {
                    status: status ? {_eq: status} : {},
                    method: method ? {_eq: method} : {},
                    user: user ? {_eq: user} : {},
                }
            }, {
                next: ({ data }) => {
                    setLogs((data?.logs as Array<Log>));
                },
                error: () => {},
                complete: () => {},
            }
        )
    }, [])

    return (
        <div>
            <p>The following query strings can be added to the url and to /logs to filter the page:</p>
            <ul>
                <li>?method=[GET,PUT,POST,DELETE]</li>
                <li>?user=[username]</li>
                <li>?code=[200,400,404,500,503,etc]</li>
            </ul>
            <Form method="post">
                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Fetch from Loggerator</button>
            </Form>
            <ul>
                {logs.map(log => (
                    <li key={`${log.date}-${log.user}`}>{log.ip} - {log.user} [{log.date}] "{log.method} {log.path} {log.protocol}" {log.status} {log.size}</li>
                ))}
            </ul>
        </div>
    )
}