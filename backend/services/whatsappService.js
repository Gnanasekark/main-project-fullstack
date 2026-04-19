import axios from "axios";

const sendWhatsAppMessage = async (
  to,
  studentName,
  formTitle,
  formLink,
  teacherName
) => {
  try {
    const formattedNumber = to.startsWith("91")
      ? to
      : `91${to.replace("+", "")}`;

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedNumber,
        type: "template",
        template: {
          name: "form_assignment",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: studentName },
                { type: "text", text: formTitle },
                { type: "text", text: formLink },
                { type: "text", text: teacherName }
              ]
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("WhatsApp Error:", error.response?.data);
    throw error;
  }
};

export default sendWhatsAppMessage;