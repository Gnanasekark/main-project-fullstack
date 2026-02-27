import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (
  studentEmail,
  studentName,
  regNo,
  formTitle,
  formLink,
  teacherEmail,
  teacherName
) => {
  const mailOptions = {
    from: `"ACE Form Portal" <${process.env.EMAIL_USER}>`,
    to: studentEmail,
    subject: `Form Assigned: ${formTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Hello ${studentName},</h2>

        <p><strong>Register Number:</strong> ${regNo}</p>

        <p>You have been assigned a new form:</p>

        <h3>${formTitle}</h3>

        <p>Please click the button below to complete your form:</p>

        <a href="${formLink}" 
           style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;">
           Fill Form
        </a>

        <p>If button does not work, copy this link:</p>
        <p>${formLink}</p>

        <br/>
        <p>Regards,</p>
        <p>${teacherName}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};