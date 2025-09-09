
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { headers as nextHeaders } from "next/headers";
import { sendEmail } from "@/lib/mail";
import { loginAlertEmail } from "@/lib/emailTemplates";
import { compare, hash } from "bcryptjs";
 
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [

    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      // Allow linking a Google login to an existing email-based user
      // so users can sign in even if they first registered with credentials.
      // Note: This relaxes a security safeguard. Ensure you trust the
      // provider’s email verification (Google does verify emails).
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" }, 
        isSignUp: { label: "SignUp?", type: "text" },
      },
      async authorize(credentials) {
        const { email, password, name, isSignUp } = credentials as any;

        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (isSignUp === "true") {
          // SIGN UP FLOW
          if (existingUser) {
            throw new Error("User already exists");
          }

          const hashedPassword = await hash(password, 10);

          const newUser = await prisma.user.create({
            data: {
              email,
              name,
              hashedPassword,
            },
          });

          return newUser;
        } else {

          if (!existingUser || !existingUser.hashedPassword) {
            throw new Error("Invalid credentials");
          }

          const isValid = await compare(password, existingUser.hashedPassword);
          if (!isValid) {
            throw new Error("Invalid credentials");
          }

          // Allow sign-in without email verification
          // (Previously blocked users with unverified email addresses.)

          return existingUser;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        if ((user as any).name) token.name = (user as any).name;
        if ((user as any).email) token.email = (user as any).email;
      }
      if (!token.id && token.email) {
        // Fallback: resolve user id by email if missing (old tokens)
        try {
          const u = await prisma.user.findUnique({ where: { email: token.email as string }, select: { id: true, name: true } });
          if (u) {
            (token as any).id = u.id;
            if (u.name && !token.name) (token as any).name = u.name;
          }
        } catch {}
      }
      if (trigger === 'update' && session) {
        const s: any = session;
        if (s?.user?.name) token.name = s.user.name;
        if (s?.name) token.name = s.name;
      }
      return token as any;
    },

    async session({ session, token }) {
      if (token && session.user) {
        if (token.id) session.user.id = token.id as string;
        if (token.name) session.user.name = token.name as string;
        if (token.email && !session.user.email) session.user.email = token.email as string;
      }
      return session;
    },
  },

  events: {
    async signIn({ user, account }) {
      try {
        if (!user?.email) return
        // Best-effort request metadata (may be missing depending on host)
        let ua: string | undefined
        let ip: string | undefined
        let city: string | undefined
        let region: string | undefined
        let country: string | undefined
        try {
          const h = nextHeaders()
          ua = h.get('user-agent') || undefined
          const xff = h.get('x-forwarded-for') || ''
          ip = (xff.split(',')[0] || '').trim() || h.get('x-real-ip') || h.get('cf-connecting-ip') || h.get('x-client-ip') || undefined
          city = h.get('x-vercel-ip-city') || h.get('cf-ipcity') || h.get('x-appengine-city') || undefined
          region = h.get('x-vercel-ip-country-region') || h.get('x-appengine-region') || undefined
          country = h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || h.get('x-appengine-country') || undefined
        } catch {}

        const device = describeDevice(ua, account?.provider)
        const location = [city, region, country].filter(Boolean).join(', ') || undefined
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        const datetime = `${new Date().toLocaleString(undefined, { hour12: false })} (${tz})`

        const tpl = loginAlertEmail({ datetime, device, ip, location })
        await sendEmail(user.email, tpl.subject, tpl.text, tpl.html)
      } catch (e) {
        console.warn('[auth] login alert email failed:', e)
      }

      function describeDevice(ua?: string, provider?: string) {
        const prov = provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : 'Credentials'
        if (!ua) return `${prov} (device unknown)`
        const os =
          /Windows NT/i.test(ua) ? 'Windows' :
          /Mac OS X/i.test(ua) ? 'macOS' :
          /Android/i.test(ua) ? 'Android' :
          /iPhone|iPad|iPod/i.test(ua) ? 'iOS' :
          /Linux/i.test(ua) ? 'Linux' : 'Unknown OS'
        const browser =
          /Edg\//i.test(ua) ? 'Edge' :
          /Chrome\//i.test(ua) ? 'Chrome' :
          /Safari\//i.test(ua) && !/Chrome\//i.test(ua) ? 'Safari' :
          /Firefox\//i.test(ua) ? 'Firefox' : 'Unknown Browser'
        return `${prov} • ${browser} on ${os}`
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
