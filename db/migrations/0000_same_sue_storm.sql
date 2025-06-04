CREATE TABLE IF NOT EXISTS "child_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"age" integer,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "module_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"child_profile_id" integer,
	"module_id" text NOT NULL,
	"settings" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "progress_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"child_profile_id" integer,
	"operation_id" text NOT NULL,
	"score" integer NOT NULL,
	"total_problems" integer NOT NULL,
	"time_spent" integer NOT NULL,
	"difficulty" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text,
	"email" text,
	"name" text,
	"provider" text,
	"provider_id" text,
	"photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "module_settings" ADD CONSTRAINT "module_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "module_settings" ADD CONSTRAINT "module_settings_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "progress_entries" ADD CONSTRAINT "progress_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "progress_entries" ADD CONSTRAINT "progress_entries_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;