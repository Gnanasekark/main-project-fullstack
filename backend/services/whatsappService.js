import axios from "axios";

const sendWhatsAppMessage = async (to) => {
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
          name: "hello_world",
          language: {
            code: "en_US"
          }
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