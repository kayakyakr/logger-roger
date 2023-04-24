import { Response } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { LoaderArgs } from "@remix-run/server-runtime";
import child_processs from "child_process";
import { Log, createLogs, fetchLogs } from "~/models/log.server";

const logMatcher = new RegExp(/(.+) \- (.+) \[(.+)\] "(.+) (.+) (.+)" (\d+) (\d+)/)
export async function action () {
    // using childprocess here instead of fetch because node fetch cannot handle http0.9. Could also use net and manually send headers/parse response
    const request = child_processs.spawn("curl", ['--http0.9', '-s', 'http://localhost:8080'], { stdio: ['pipe', 'pipe', process.stderr] })

    let remainder = ""
    request.stdout.on("data", function(data: ReadableStream) {
        const batch = data.toString()
        const logLines = batch.split('\n')
        
        if( logLines.length === 0 ) return;

        logLines[0] = `${remainder}${logLines[0]}`
        remainder = logLines.pop() || ''

        const logObjects: Array<Log | null> = logLines.map(line => {
            const match = logMatcher.exec(line)
            if( !match ) return null;
            return {
                ip: match[1],
                user: match[2],
                date: match[3],
                method: match[4],
                path: match[5],
                protocol: match[6],
                status: match[7],
                size: match[8],
            }
        }).filter(l => l);
        
        // add logs to database
        createLogs(logObjects as Array<Log>) // cast is because we've removed nulls, but TS doesn't understand that.
    });

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
                    <li>{log.ip} - {log.user} [{log.date}] "{log.method} {log.path} {log.protocol}" {log.status} {log.size}</li>
                ))}
            </ul>
        </div>
    )
}