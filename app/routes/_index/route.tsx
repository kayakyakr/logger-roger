import { Response } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { LoaderArgs } from "@remix-run/server-runtime";
import child_processs from "child_process";
import { Log, createLogs, fetchLogs } from "~/models/log.server";
import fetchLogFromLoggerator from "./fetchLog.server";

export async function action () {
    fetchLogFromLoggerator()
    
    return new Response("", {
        status: 200,
        statusText: "OK",
    })
}


export async function loader({ request } : LoaderArgs) {
    return {
        logs: await fetchLogs(request)
    }
}

type LoaderType = Awaited<ReturnType<typeof loader>>;

export default function HomePage() {
    const { logs } = useLoaderData<LoaderType>()

    return (
        <div>
            <Form method="post">
                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Refresh</button>
            </Form>
            <ul>
                {logs.map(log => (
                    <li key={`${log.date}-${log.user}`}>{log.ip} - {log.user} [{log.date}] "{log.method} {log.path} {log.protocol}" {log.status} {log.size}</li>
                ))}
            </ul>
        </div>
    )
}