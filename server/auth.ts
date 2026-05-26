import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";
import type { Express, RequestHandler } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const GUEST_USER_ID = "guest";
const GUEST_USER = {
  claims: { sub: GUEST_USER_ID },
  id: GUEST_USER_ID,
  username: "guest",
  firstName: "Guest",
  lastName: "User",
};

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  const sessionTtl = 7 * 24 * 60 * 60 * 1000;

  let sessionStore: session.Store;
  if (process.env.DATABASE_URL) {
    const PgStore = connectPg(session);
    sessionStore = new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  } else {
    const MemoryStore = memorystore(session);
    sessionStore = new MemoryStore({ checkPeriod: sessionTtl });
  }

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "swing-analyzer-secret-change-me",
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: sessionTtl,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Ensure guest user exists in DB when using a database
  if (process.env.DATABASE_URL) {
    try {
      await db
        .insert(users)
        .values({
          id: GUEST_USER_ID,
          email: "guest@local",
          firstName: "Guest",
          lastName: "User",
        })
        .onConflictDoNothing();
    } catch {
      // ignore – user already exists
    }
  }

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const adminUser = process.env.ADMIN_USERNAME || "admin";
      const adminPass = process.env.ADMIN_PASSWORD || "changeme";
      if (username === adminUser && password === adminPass) {
        return done(null, {
          claims: { sub: adminUser },
          id: adminUser,
          username: adminUser,
        });
      }
      return done(null, false, { message: "Invalid credentials" });
    })
  );

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Login routes
  app.get("/api/login", (_req, res) => {
    res.redirect("/#login");
  });

  app.post("/api/login", passport.authenticate("local", { failureMessage: true }), (req, res) => {
    res.json({ ok: true, user: (req.user as any)?.id });
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => res.json({ ok: true }));
  });

  // Auto-login as guest if no auth configured and no user in session
  app.use((req, _res, next) => {
    if (!req.isAuthenticated() && !process.env.REQUIRE_AUTH) {
      (req as any).user = GUEST_USER;
    }
    next();
  });
}

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({
      id: req.user.claims?.sub || req.user.id,
      firstName: req.user.firstName || req.user.id,
      lastName: req.user.lastName || "",
      email: req.user.email || "",
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.user || !process.env.REQUIRE_AUTH) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
