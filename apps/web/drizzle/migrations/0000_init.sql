CREATE SCHEMA "app";
--> statement-breakpoint
CREATE SCHEMA "raw";
--> statement-breakpoint
CREATE TABLE "app"."benchmark_meta" (
	"slug" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"tagline" text,
	"status" text DEFAULT 'live' NOT NULL,
	"link" text,
	"generated_at" timestamp with time zone,
	"window_start" date,
	"window_end" date,
	"total_pass" integer,
	"total_solved" integer,
	"headline_pct" numeric,
	"resolved_correctly_pct" numeric
);
--> statement-breakpoint
CREATE TABLE "app"."bucket_styles" (
	"bucket" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"color" text NOT NULL,
	"ordering" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."domains" (
	"host" text NOT NULL,
	"benchmark_slug" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"buckets" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dominant_bucket" text,
	"rebind" text,
	"category" text,
	CONSTRAINT "domains_benchmark_slug_host_pk" PRIMARY KEY("benchmark_slug","host")
);
--> statement-breakpoint
CREATE TABLE "app"."markets" (
	"slug" text PRIMARY KEY NOT NULL,
	"benchmark_slug" text NOT NULL,
	"market_id" text,
	"date" date NOT NULL,
	"event_slug" text DEFAULT '' NOT NULL,
	"question" text NOT NULL,
	"bucket" text,
	"winner" text,
	"named_source" text,
	"verified_source" text,
	"e_rs_host" text,
	"rebind_host" text,
	"status" text,
	"circle" text,
	"l1" text,
	"l2" text,
	"l3" text,
	"template_id" text,
	"in_explorer" boolean DEFAULT false NOT NULL,
	"in_unsolvables" boolean DEFAULT false NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"synthetic" boolean DEFAULT false NOT NULL,
	"detail_available" boolean DEFAULT true NOT NULL,
	"polymarket_url" text
);
--> statement-breakpoint
CREATE TABLE "app"."onchain_feed_stats" (
	"benchmark_slug" text PRIMARY KEY NOT NULL,
	"chainlink" integer DEFAULT 0 NOT NULL,
	"pyth" integer DEFAULT 0 NOT NULL,
	"chainlink_plus_pyth" integer DEFAULT 0 NOT NULL,
	"addressable" integer DEFAULT 0 NOT NULL,
	"polled_universe" integer DEFAULT 0 NOT NULL,
	"chainlink_pct" numeric DEFAULT '0' NOT NULL,
	"pyth_pct" numeric DEFAULT '0' NOT NULL,
	"onchain_feed_pct" numeric DEFAULT '0' NOT NULL,
	"addressable_pct" numeric DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."per_day" (
	"benchmark_slug" text NOT NULL,
	"date" date NOT NULL,
	"gate1_pass" integer DEFAULT 0 NOT NULL,
	"solved" integer DEFAULT 0 NOT NULL,
	"solved_pct" numeric,
	"resolved" integer DEFAULT 0 NOT NULL,
	"buckets" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"chainlink" integer,
	"pyth" integer,
	"direct_deep" integer DEFAULT 0 NOT NULL,
	"direct_shallow" integer DEFAULT 0 NOT NULL,
	"alt" integer DEFAULT 0 NOT NULL,
	"unsolvable" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "per_day_benchmark_slug_date_pk" PRIMARY KEY("benchmark_slug","date")
);
--> statement-breakpoint
CREATE TABLE "app"."templates" (
	"id" text PRIMARY KEY NOT NULL,
	"benchmark_slug" text NOT NULL,
	"l1" text NOT NULL,
	"l2" text NOT NULL,
	"l3" text NOT NULL,
	"template" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"buckets" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dominant_bucket" text,
	"e_rs_hosts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rebind_host" text,
	"dates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"example" jsonb
);
--> statement-breakpoint
CREATE TABLE "raw"."gate_evaluations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"poll_id" integer,
	"market_id" text NOT NULL,
	"evaluated_for" date NOT NULL,
	"passed" boolean NOT NULL,
	"dropped_at_gate" integer,
	"drop_reason" text,
	"bucket" text,
	"binding_domain" text,
	"binding_url" text,
	"notes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw"."market_observations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"poll_id" integer,
	"market_id" text NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text,
	"outcome_prices" jsonb,
	"closed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw"."market_outcomes" (
	"market_id" text PRIMARY KEY NOT NULL,
	"closed_at" timestamp with time zone,
	"winner_outcome" text,
	"outcome_prices" jsonb,
	"source_url" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw"."markets" (
	"id" text PRIMARY KEY NOT NULL,
	"condition_id" text,
	"event_slug" text,
	"slug" text,
	"question" text NOT NULL,
	"end_date" timestamp with time zone,
	"volume_num" numeric,
	"raw_payload" jsonb NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw"."polls" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"poll_date" date NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"markets_seen" integer DEFAULT 0 NOT NULL,
	"script_version" text,
	"notes" jsonb
);
--> statement-breakpoint
CREATE TABLE "raw"."studio_deploys" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"market_id" text NOT NULL,
	"binding_domain" text,
	"deploy_ok" boolean,
	"resolve_tx" text,
	"raw_outcome" text,
	"match" boolean,
	"elapsed_ms" integer,
	"deployed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" jsonb
);
--> statement-breakpoint
ALTER TABLE "app"."domains" ADD CONSTRAINT "domains_benchmark_slug_benchmark_meta_slug_fk" FOREIGN KEY ("benchmark_slug") REFERENCES "app"."benchmark_meta"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."markets" ADD CONSTRAINT "markets_benchmark_slug_benchmark_meta_slug_fk" FOREIGN KEY ("benchmark_slug") REFERENCES "app"."benchmark_meta"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."onchain_feed_stats" ADD CONSTRAINT "onchain_feed_stats_benchmark_slug_benchmark_meta_slug_fk" FOREIGN KEY ("benchmark_slug") REFERENCES "app"."benchmark_meta"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."per_day" ADD CONSTRAINT "per_day_benchmark_slug_benchmark_meta_slug_fk" FOREIGN KEY ("benchmark_slug") REFERENCES "app"."benchmark_meta"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."templates" ADD CONSTRAINT "templates_benchmark_slug_benchmark_meta_slug_fk" FOREIGN KEY ("benchmark_slug") REFERENCES "app"."benchmark_meta"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw"."gate_evaluations" ADD CONSTRAINT "gate_evaluations_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "raw"."polls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw"."gate_evaluations" ADD CONSTRAINT "gate_evaluations_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "raw"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw"."market_observations" ADD CONSTRAINT "market_observations_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "raw"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw"."market_observations" ADD CONSTRAINT "market_observations_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "raw"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw"."market_outcomes" ADD CONSTRAINT "market_outcomes_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "raw"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw"."studio_deploys" ADD CONSTRAINT "studio_deploys_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "raw"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_markets_benchmark_date_idx" ON "app"."markets" USING btree ("benchmark_slug","date");--> statement-breakpoint
CREATE INDEX "app_markets_bucket_idx" ON "app"."markets" USING btree ("bucket");--> statement-breakpoint
CREATE INDEX "app_markets_template_idx" ON "app"."markets" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "app_markets_explorer_idx" ON "app"."markets" USING btree ("in_explorer");--> statement-breakpoint
CREATE INDEX "per_day_date_idx" ON "app"."per_day" USING btree ("date");--> statement-breakpoint
CREATE INDEX "app_templates_benchmark_idx" ON "app"."templates" USING btree ("benchmark_slug");--> statement-breakpoint
CREATE INDEX "gate_eval_market_evalfor_idx" ON "raw"."gate_evaluations" USING btree ("market_id","evaluated_for");--> statement-breakpoint
CREATE INDEX "gate_eval_evalfor_idx" ON "raw"."gate_evaluations" USING btree ("evaluated_for");--> statement-breakpoint
CREATE INDEX "gate_eval_bucket_idx" ON "raw"."gate_evaluations" USING btree ("bucket");--> statement-breakpoint
CREATE INDEX "market_obs_market_observed_idx" ON "raw"."market_observations" USING btree ("market_id","observed_at");--> statement-breakpoint
CREATE INDEX "markets_slug_idx" ON "raw"."markets" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "markets_event_slug_idx" ON "raw"."markets" USING btree ("event_slug");--> statement-breakpoint
CREATE INDEX "markets_end_date_idx" ON "raw"."markets" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "polls_poll_date_idx" ON "raw"."polls" USING btree ("poll_date");--> statement-breakpoint
CREATE INDEX "studio_deploys_market_id_idx" ON "raw"."studio_deploys" USING btree ("market_id");