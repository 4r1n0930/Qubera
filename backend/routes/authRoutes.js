import express from "express";
import { OAuth2Client } from "google-auth-library";
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