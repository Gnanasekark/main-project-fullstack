import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendWhatsApp = async (to, message) => {
  await client.messages.create({
    from: "whatsapp:+14155238886", // Twilio sandbox
    to: `whatsapp:${to}`,
    body: message
  });
};