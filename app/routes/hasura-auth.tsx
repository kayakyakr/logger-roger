import { json } from "@remix-run/server-runtime"

export function loader() {
    console.log('Requested')

    return json({
        'X-Hasura-Role': 'everyone'
    })
}