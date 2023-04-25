import type { LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import tailwindStylesheetUrl from "./generatedcss/tailwind.css";


export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwindStylesheetUrl }];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Logger Roger",
  viewport: "width=device-width,initial-scale=1",
});

type LoaderData = {
};

export async function loader({ request }: LoaderArgs) {
  return json<LoaderData>({
  });
}

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload port={Number(process.env.REMIX_DEV_SERVER_WS_PORT)} />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error } : { error : any}) {
  console.error(error);
  return (
    <html>
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
      </head>
      <body>
        <h2>Application Error!</h2>
        <p>{error}</p>
        <Scripts />
      </body>
    </html>
  );
}