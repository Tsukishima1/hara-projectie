import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, registerSchema } from "../schemas";
import { createAdminClient } from "@/lib/appwrite";
import { deleteCookie, setCookie } from "hono/cookie";
import { AUTH_COOKIE } from "../constants";
import { ID } from "node-appwrite";
import { sessionMiddleware } from "@/lib/session-middleware";
import { ErrorHandler } from "@/lib/error-handler";

const app = new Hono()
    .get(
        "/current",
        sessionMiddleware,
        (c) => {
            const user = c.get("user");
            return c.json({ data: user });
        }
    )
    .post(
        "/login",
        zValidator("json", loginSchema),
        async (c) => {
            try {
                const { email, password } = c.req.valid("json");

                const { account } = await createAdminClient();

                const session = await account.createEmailPasswordSession(
                    email,
                    password
                );

                setCookie(c, AUTH_COOKIE, session.secret, {
                    path: "/",
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict",
                    maxAge: 60 * 60 * 24 * 30,
                });

                return c.json({ success: true, message: "Login successful" });
            } catch (error) {
                const { message, statusCode } = ErrorHandler(error);
                return c.json({ success: false, message }, { status: statusCode });
            }
        }
    )
    .post(
        "/register",
        zValidator("json", registerSchema),
        async (c) => {
            try {
                const { email, name, password } = c.req.valid("json");

                const { account } = await createAdminClient();
                await account.create(
                    ID.unique(),
                    email,
                    password,
                    name
                )

                const session = await account.createEmailPasswordSession(
                    email,
                    password
                );

                setCookie(c, AUTH_COOKIE, session.secret, {
                    path: "/",
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict",
                    maxAge: 60 * 60 * 24 * 30,
                });

                return c.json({ success: true, message: "Registery successful" });
            } catch (error) {
                const { message, statusCode } = ErrorHandler(error);
                return c.json({ success: false, message }, { status: statusCode });
            }

        }
    )
    .post(
        "/logout",
        sessionMiddleware,
        async (c) => {
            const account = c.get("account");

            deleteCookie(c, AUTH_COOKIE);
            await account.deleteSession("current");

            return c.json({ success: true });
        }
    )


export default app;