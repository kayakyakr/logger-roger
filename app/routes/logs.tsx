import { LoaderArgs, json } from "@remix-run/server-runtime";
import { fetchLogs } from "~/models/log.server";

export async function loader({ request }: LoaderArgs) {
    return json(await fetchLogs(request))
}