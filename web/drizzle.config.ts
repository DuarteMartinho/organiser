import type { Config } from "drizzle-kit";

const config: Config = {
    schema: "./db/schema.ts", // Path to your schema file
    out: "./db/migrations",  // Path to store migration files
    dialect: "postgresql",   // Specify the database dialect
    dbCredentials: {
        host: "192.168.1.100",
        port: 5432,
        user: "postgres",
        password: process.env.DB_PASSWORD,
        database: "organiser",
        ssl: false,
    },
};

export default config;