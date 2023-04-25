
import child_process from "child_process";
import { Log, createLogs } from "~/models/log.server";

const logMatcher = new RegExp(/(.+) \- (.+) \[(.+)\] "(.+) (.+) (.+)" (\d+) (\d+)/)

export function parseLog(line: string) {
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
}

export default function fetchLogFromLoggerator() {
    const request = child_process.spawn("curl", ['--http0.9', '-s', 'http://localhost:8080'], { stdio: ['pipe', 'pipe', process.stderr] })

    let remainder = ""
    let startTime = Date.now()
    let tickTime = Date.now()
    let tickCount = 0
    let count = 0
    request.stdout.on("data", async function(data: ReadableStream) {
        const batch = data.toString()
        const logLines = batch.split('\n')
        
        if( logLines.length === 0 ) return;

        logLines[0] = `${remainder}${logLines[0]}`
        if(logLines.length > 1 && !logMatcher.test(logLines.slice(-1)[0])) remainder = logLines.pop() || '';

        const logObjects: Array<Log | null> = logLines.map(parseLog).filter(l => l);
        
        // add logs to database
        await createLogs(logObjects as Array<Log>) // cast is because we've removed nulls, but TS doesn't understand that.
        
        // Do some logging. This is going to be not exactly stable thanks to JS IO, but should get us close enough.
        count += logObjects.length
        const now = Date.now()
        if(now - tickTime > 1000) {
            const logsSec = 1000 * (count - tickCount) / (now - tickTime)
            const avgLogsSec = 1000 * count / (now - startTime)
            process.stdout.clearLine(0)
            process.stdout.cursorTo(0)
            process.stdout.write(`Processed ${count} logs. ${logsSec} logs/sec. ${avgLogsSec} avg logs/sec`)
            tickCount = count;
            tickTime = now;
        }
    })
}