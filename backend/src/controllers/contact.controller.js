import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { contact } from "../models/contact.model.js";
import { Sendmail } from "../utils/Nodemailer.js";

export const handleContactSubmit = asyncHandler(async (req, res) => {
    const { name, email, message } = req.body;

    if ([name, email, message].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Name, email and message are required fields");
    }

    // Save inquiry to the Contact collection
    const newContact = await contact.create({
        name,
        email,
        message,
        status: false
    });

    if (!newContact) {
        throw new ApiError(500, "Failed to submit your inquiry. Please try again.");
    }

    // Try sending confirmation emails via Nodemailer
    try {
        // Send confirmation email to the user
        await Sendmail(
            email,
            "We received your message - Shiksharthee Support",
            `<html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #008280;">Hi ${name},</h2>
                    <p>Thank you for reaching out to us. We have received your inquiry and our team will get back to you shortly.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <strong>Your Message:</strong><br/>
                        ${message}
                    </div>
                    <p>Best regards,<br/><strong>The Shiksharthee Team</strong></p>
                </body>
            </html>`
        );

        // Also notify admin if configured
        if (process.env.SMTP_EMAIL) {
            await Sendmail(
                process.env.SMTP_EMAIL,
                `New Inquiry from ${name}`,
                `<p>You received a new inquiry on the E-Learning Platform.</p>
                 <p><strong>Name:</strong> ${name}</p>
                 <p><strong>Email:</strong> ${email}</p>
                 <p><strong>Message:</strong> ${message}</p>`
            );
        }
    } catch (emailError) {
        // Log email sending failures, but don't fail the response since DB save was successful
        console.error("Nodemailer contact email failed:", emailError);
    }

    return res.status(200).json(
        new ApiResponse(200, newContact, "Inquiry submitted successfully. We will contact you soon!")
    );
});
