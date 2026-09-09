import express from "express";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};


// =========================
// REGISTER
// POST /auth/register
// =========================

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please provide all required fields",
            });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        // Generate 6-digit verification code
        const verificationCode = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const verificationCodeExpires =
            Date.now() + 24 * 60 * 60 * 1000;

        const user = await User.create({
            name,
            email,
            password,
            verificationCode,
            verificationCodeExpires,
        });

        // Send verification email
        console.log(
            `Verification code for ${email}: ${verificationCode}`
        );

        if (process.env.SMTP_HOST) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                to: user.email,
                subject: "Email Verification Code",
                text: `Your verification code is: ${verificationCode}. It will expire in 24 hours.`,
            });
        }

        res.status(201).json({
            message: "User registered. Please verify your email.",
            email: user.email,
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});


// =========================
// VERIFY EMAIL
// POST /auth/verify-email
// =========================

router.post("/verify-email", async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                message: "Please provide email and code",
            });
        }

        const user = await User.findOne({
            email,
            verificationCode: code,
            verificationCodeExpires: {
                $gt: Date.now(),
            },
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired verification code",
            });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;

        await user.save();

        const token = generateToken(user);

        res.json({
            message: "Email verified successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePhoto: user.profilePhoto,
            },
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});


// =========================
// LOGIN
// POST /auth/login
// =========================

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password",
            });
        }

        const user = await User.findOne({ email }).select("+password");

        if (
            user &&
            user.password &&
            (await user.comparePassword(password))
        ) {

            if (!user.isVerified) {
                return res.status(401).json({
                    message: "Please verify your email before logging in",
                    notVerified: true,
                });
            }

            const token = generateToken(user);

            return res.json({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profilePhoto: user.profilePhoto,
                },
            });
        }

        res.status(401).json({
            message: "Invalid email or password",
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});


// =========================
// PUBLIC AUTH CONFIG
// GET /auth/config
// =========================

router.get("/config", (req, res) => {
    // Public values only — never expose secrets (client secret stays server-side).
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID || null,
        githubEnabled: Boolean(
            process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
        ),
    });
});


// =========================
// GOOGLE LOGIN
// POST /auth/google
// =========================

router.post("/google", async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                message: "Google credential is required",
            });
        }

        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        const {
            sub,
            email,
            name,
            picture,
        } = payload;

        // Find existing user by Google ID
        let user = await User.findOne({
            googleId: sub,
        });

        if (!user) {

            // Check if account already exists with same email
            user = await User.findOne({
                email,
            });

            if (user) {

                // Link Google account
                user.googleId = sub;

                if (!user.profilePhoto) {
                    user.profilePhoto = picture;
                }

                user.isVerified = true;

                await user.save();

            } else {

                // Create new Google user
                user = await User.create({
                    googleId: sub,
                    email,
                    name,
                    profilePhoto: picture,
                    isVerified: true,
                });
            }
        }

        const token = generateToken(user);

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePhoto: user.profilePhoto,
            },
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Authentication failed",
        });
    }
});


// =========================
// GOOGLE OAUTH - INITIATE
// GET /auth/google
// =========================
// Redirect flow (mirrors GitHub). The browser is sent to Google's consent
// screen; on completion Google redirects to /auth/google/callback which
// exchanges the code and lands back on the frontend with a token.

router.get("/google", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
        return res.status(500).json({
            message: "Google OAuth is not configured",
        });
    }

    const redirectUri =
        process.env.GOOGLE_CALLBACK_URL ||
        `${req.protocol}://${req.get("host")}/auth/google/callback`;

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "online",
        // Ensure we always get a fresh prompt so the user can pick an account.
        prompt: "select_account",
    });

    res.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    );
});

// =========================
// GOOGLE OAUTH - CALLBACK
// GET /auth/google/callback
// =========================

router.get("/google/callback", async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173/dashboard";

    try {
        const { code, error } = req.query;

        if (error) {
            // User denied authorization
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "Google authorization denied."
                )}`
            );
        }

        if (!code) {
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "Google authorization failed: missing code."
                )}`
            );
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "Google OAuth is not configured."
                )}`
            );
        }

        const redirectUri =
            process.env.GOOGLE_CALLBACK_URL ||
            `${req.protocol}://${req.get("host")}/auth/google/callback`;

        const oauthClient = new OAuth2Client(clientId, clientSecret, redirectUri);

        // Exchange the authorization code for tokens
        let tokenResponse;
        try {
            const { tokens } = await oauthClient.getToken(code);
            oauthClient.setCredentials(tokens);
            tokenResponse = tokens;
        } catch (err) {
            console.error("Google token exchange error:", err.message);
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "Google authentication failed during token exchange."
                )}`
            );
        }

        // Verify the ID token to get the user profile
        let ticket;
        try {
            ticket = await oauthClient.verifyIdToken({
                idToken: tokenResponse.id_token,
                audience: clientId,
            });
        } catch (err) {
            console.error("Google ID token verification error:", err.message);
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "Failed to verify Google identity."
                )}`
            );
        }

        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;

        if (!email) {
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "Google account has no accessible email."
                )}`
            );
        }

        // Find or create the user (same linking logic as the ID-token flow)
        let user = await User.findOne({ googleId: sub });

        if (!user) {
            // Try to link an existing account with the same email
            user = await User.findOne({ email });

            if (user) {
                user.googleId = sub;
                if (!user.profilePhoto && picture) {
                    user.profilePhoto = picture;
                }
                user.isVerified = true;
                await user.save();
            } else {
                user = await User.create({
                    googleId: sub,
                    email,
                    name,
                    profilePhoto: picture,
                    isVerified: true,
                });
            }
        }

        const token = generateToken(user);

        return res.redirect(
            `${frontendUrl}/auth/callback?token=${encodeURIComponent(
                token
            )}&user=${encodeURIComponent(
                JSON.stringify({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profilePhoto: user.profilePhoto,
                })
            )}`
        );
    } catch (error) {
        console.error(error);
        return res.redirect(
            `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                "Google authentication failed unexpectedly."
            )}`
        );
    }
});


// =========================
// GITHUB OAUTH - INITIATE
// GET /auth/github
// =========================

router.get("/github", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;

    if (!clientId) {
        return res.status(500).json({
            message: "GitHub OAuth is not configured",
        });
    }

    const redirectUri =
        process.env.GITHUB_CALLBACK_URL ||
        `${req.protocol}://${req.get("host")}/auth/github/callback`;

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "user:email",
    });

    res.redirect(
        `https://github.com/login/oauth/authorize?${params.toString()}`
    );
});

// =========================
// GITHUB OAUTH - CALLBACK
// GET /auth/github/callback
// =========================

router.get("/github/callback", async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173/dashboard";

    try {
        const { code, error } = req.query;

        if (error) {
            // User denied authorization
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "GitHub authorization denied."
                )}`
            );
        }

        if (!code) {
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "GitHub authorization failed: missing code."
                )}`
            );
        }

        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "GitHub OAuth is not configured."
                )}`
            );
        }

        console.log("GitHub callback code:", code);

        // Exchange the authorization code for an access token
        let tokenResponse;
        try {
            tokenResponse = await axios.post(
                "https://github.com/login/oauth/access_token",
                {
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                },
                {
                    headers: {
                        Accept: "application/json",
                    },
                }
            );
        } catch (err) {
            console.error("GitHub token exchange error:", err.message);
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "GitHub authentication failed during token exchange."
                )}`
            );
        }

        const { access_token, error: tokenError } = tokenResponse.data;

        if (tokenError || !access_token) {
            console.error("GitHub access token error:", tokenError);
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "GitHub authentication failed. Invalid authorization code."
                )}`
            );
        }

        // Fetch GitHub user profile
        let githubUser;
        try {
            githubUser = await axios.get(
                "https://api.github.com/user",
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        Accept: "application/vnd.github+json",
                    },
                }
            );
        } catch (err) {
            console.error("GitHub profile fetch error:", err.message);
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "Failed to retrieve GitHub profile."
                )}`
            );
        }

        const userData = githubUser.data;

        // Fetch primary verified email if not public
        let email = userData.email || null;

        if (!email && userData.email === null) {
            try {
                const emailsResponse = await axios.get(
                    "https://api.github.com/user/emails",
                    {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            Accept: "application/vnd.github+json",
                        },
                    }
                );
                const emails = emailsResponse.data;
                const verified = emails.find(
                    (e) => e.verified && e.primary
                );
                email = (verified || emails[0])?.email || null;
            } catch (err) {
                console.error(
                    "GitHub emails fetch error:",
                    err.message
                );
            }
        }

        if (!email) {
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                    "GitHub account has no accessible email. Please sign up with an email or make your GitHub email public."
                )}`
            );
        }

        // Find or create user
        let user = await User.findOne({
            githubId: String(userData.id),
        });

        if (!user) {
            // Try to link with an existing account using the same email
            user = await User.findOne({ email });

            if (user) {
                // Link GitHub account to existing user
                user.githubId = String(userData.id);

                if (!user.profilePhoto && userData.avatar_url) {
                    user.profilePhoto = userData.avatar_url;
                }

                user.isVerified = true;

                await user.save();
            } else {
                // Create a new GitHub user
                user = await User.create({
                    githubId: String(userData.id),
                    email,
                    name:
                        userData.name ||
                        userData.login ||
                        "GitHub User",
                    profilePhoto: userData.avatar_url,
                    isVerified: true,
                });
            }
        }

        const token = generateToken(user);

        return res.redirect(
            `${frontendUrl}/auth/callback?token=${encodeURIComponent(
                token
            )}&user=${encodeURIComponent(
                JSON.stringify({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profilePhoto: user.profilePhoto,
                })
            )}`
        );
    } catch (error) {
        console.error(error);
        return res.redirect(
            `${frontendUrl}/auth/callback?error=${encodeURIComponent(
                "GitHub authentication failed unexpectedly."
            )}`
        );
    }
});


// =========================
// FORGOT PASSWORD
// POST /auth/forgot-password
// =========================

router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // Generate reset token
        const resetToken = crypto
            .randomBytes(20)
            .toString("hex");

        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordExpires =
            Date.now() + 3600000; // 1 hour

        await user.save();

        // Create reset URL
        const resetUrl =
            `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        console.log(`Password reset link: ${resetUrl}`);

        if (process.env.SMTP_HOST) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            try {
                await transporter.sendMail({
                    to: user.email,
                    subject: "Password Reset Request",
                    text: `
You requested a password reset.

Click the link below:

${resetUrl}

If you did not request this, please ignore this email.
          `,
                });
            } catch (error) {
                console.error(
                    "Error sending email:",
                    error
                );
            }
        }

        res.json({
            message: "Reset link sent to your email",
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});


// =========================
// RESET PASSWORD
// POST /auth/reset-password/:token
// =========================

router.post(
    "/reset-password/:token",
    async (req, res) => {
        try {
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({
                    message: "Please provide a new password",
                });
            }

            const resetPasswordToken = crypto
                .createHash("sha256")
                .update(req.params.token)
                .digest("hex");

            const user = await User.findOne({
                resetPasswordToken,
                resetPasswordExpires: {
                    $gt: Date.now(),
                },
            });

            if (!user) {
                return res.status(400).json({
                    message: "Invalid or expired token",
                });
            }

            user.password = password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            await user.save();

            res.json({
                message: "Password reset successful",
            });

        } catch (error) {
            res.status(500).json({
                message: error.message,
            });
        }
    }
);


// =========================
// UPDATE NAME
// PUT /auth/update-name
// =========================

router.put(
    "/update-name",
    protect,
    async (req, res) => {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({
                    message: "Name is required",
                });
            }

            const user = await User.findByIdAndUpdate(
                req.user.userId,
                { name },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({
                    message: "User not found",
                });
            }

            res.json({
                message: "Name updated successfully",
                name: user.name,
            });

        } catch (error) {
            res.status(500).json({
                message: error.message,
            });
        }
    }
);


// =========================
// GET PROFILE
// GET /auth/profile
// =========================

router.get(
    "/profile",
    protect,
    async (req, res) => {
        try {
            const user = await User.findById(
                req.user.userId
            );

            if (!user) {
                return res.status(404).json({
                    message: "User not found",
                });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePhoto: user.profilePhoto,
                isVerified: user.isVerified,
            });

        } catch (error) {
            res.status(500).json({
                message: error.message,
            });
        }
    }
);


// =========================
// RESEND VERIFICATION CODE
// POST /auth/resend-code
// =========================

router.post(
    "/resend-code",
    async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    message: "Please provide an email",
                });
            }

            const user = await User.findOne({
                email,
            });

            if (!user) {
                return res.status(404).json({
                    message: "User not found",
                });
            }

            if (user.isVerified) {
                return res.status(400).json({
                    message: "Email is already verified",
                });
            }

            // Generate new verification code
            const verificationCode = Math.floor(
                100000 + Math.random() * 900000
            ).toString();

            const verificationCodeExpires =
                Date.now() + 24 * 60 * 60 * 1000;

            user.verificationCode = verificationCode;
            user.verificationCodeExpires =
                verificationCodeExpires;

            await user.save();

            console.log(
                `New verification code for ${email}: ${verificationCode}`
            );

            if (process.env.SMTP_HOST) {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                await transporter.sendMail({
                    to: user.email,
                    subject: "New Email Verification Code",
                    text: `
Your new verification code is: ${verificationCode}.
It will expire in 24 hours.
          `,
                });
            }

            res.json({
                message: "New verification code sent to your email",
            });

        } catch (error) {
            res.status(500).json({
                message: error.message,
            });
        }
    }
);


export default router;