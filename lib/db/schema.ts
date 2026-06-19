import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* better-auth tables                                                  */
/* These match better-auth's default schema for the Drizzle pg adapter */
/* (text ids). Keep field names as better-auth expects them.           */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

/* ------------------------------------------------------------------ */
/* Domain tables                                                       */
/* ------------------------------------------------------------------ */

export const matchStatus = pgEnum("match_status", ["scheduled", "played"]);

export const tournament = pgTable("tournament", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  teamCount: integer("team_count").notNull(),
  playersPerTeam: integer("players_per_team").notNull(),
  doubleRound: boolean("double_round").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const team = pgTable("team", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournament.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const player = pgTable(
  "player",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    number: integer("number").notNull(),
    email: text("email"),
  },
  (t) => [
    // A shirt number is unique within its team — makes "tap the number,
    // not the name" unambiguous when logging a goal.
    unique("player_team_number_unique").on(t.teamId, t.number),
  ],
);

export const match = pgTable("match", {
  id: uuid("id").primaryKey().defaultRandom(),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournament.id, { onDelete: "cascade" }),
  round: integer("round").notNull(),
  homeTeamId: uuid("home_team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  awayTeamId: uuid("away_team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  kickoffAt: timestamp("kickoff_at", { withTimezone: true }),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: matchStatus("status").notNull().default("scheduled"),
});

export const goal = pgTable("goal", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => match.id, { onDelete: "cascade" }),
  scorerId: uuid("scorer_id")
    .notNull()
    .references(() => player.id, { onDelete: "cascade" }),
  teamId: uuid("team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  minute: integer("minute"),
});

/* ------------------------------------------------------------------ */
/* Inferred types                                                      */
/* ------------------------------------------------------------------ */

export type Tournament = typeof tournament.$inferSelect;
export type Team = typeof team.$inferSelect;
export type Player = typeof player.$inferSelect;
export type Match = typeof match.$inferSelect;
export type Goal = typeof goal.$inferSelect;
