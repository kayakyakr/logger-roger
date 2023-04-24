CREATE TABLE "public"."logs" ("id" serial NOT NULL, "ip" inet NOT NULL, "user" text NOT NULL, "date" date NOT NULL DEFAULT now(), "method" character varying(6) NOT NULL, "path" text NOT NULL, "protocol" text NOT NULL, "status" integer NOT NULL, "size" integer NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"));
