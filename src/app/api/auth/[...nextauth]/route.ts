
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
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

          // Require email verification before allowing sign-in with credentials
          if (!existingUser.emailVerified) {
            throw new Error("Please verify your email before signing in.");
          }

          return existingUser;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
