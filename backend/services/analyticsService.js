export const sendReminderIfPending = async () => {
    const [students] = await db.promise().query(
      "SELECT * FROM students WHERE form_status='pending'"
    );
  
    for (let student of students) {
      await sendEmail(student.email, "Reminder", "Submit your form.");
    }
  };