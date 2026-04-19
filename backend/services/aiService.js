import db from "../config/db.js";

/* -----------------------------
Format Table
----------------------------- */
function formatTable(rows) {
  if (!rows.length) return "No data found.";

  const keys = Object.keys(rows[0]);

  return rows
    .map((r, i) =>
      `${i + 1}. ` + keys.map(k => `${k}: ${k === "created_at" ? new Date(r[k]).toLocaleDateString() : r[k]}`).join(" | ")
    )
    .join("\n");
}



/* -----------------------------
Normalize Question
----------------------------- */
function normalizeQuestion(question) {
  return question
    .toLowerCase()
    .replace(/[?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* -----------------------------
Detect Intent
----------------------------- */
function detectIntent(question) {

  const q = question.toLowerCase().trim();

  if (q === "help" || q.includes("what can you do"))
    return "HELP";

  if (q.includes("list") && q.includes("forms")) return "LIST_FORMS";
  if (q.includes("list") && q.includes("groups")) return "LIST_GROUPS";

  if (q.includes("how many forms") || q.includes("count forms"))
    return "COUNT_FORMS";

  if (q.includes("how many groups") || q.includes("count groups"))
    return "COUNT_GROUPS";

  if (q.includes("how many students") || q.includes("count students"))
    return "COUNT_STUDENTS";

  if (q.includes("top students")) return "TOP_STUDENTS";

  if (q.includes("students per group"))
    return "STUDENTS_PER_GROUP";

  if (q.includes("most students"))
    return "GROUP_WITH_MOST_STUDENTS";

  if (q.includes("lowest submissions"))
    return "LOWEST_FORM";
  if (q.includes("highest submissions"))
    return "HIGHEST_FORM";

  if (q.includes("didn't submit") || q.includes("not submitted"))
    return "STUDENTS_NOT_SUBMITTED";

  if (q.includes("section"))
    return "STUDENTS_BY_SECTION";

  if (q.includes("most submissions"))
    return "GROUP_MOST_SUBMISSIONS";

  if (q.includes("pending students"))
    return "PENDING_STUDENTS_FORM";

  if (q.includes("students in"))
    return "STUDENTS_BY_BRANCH";

  if (q.includes("top forms"))
    return "TOP_FORMS";

  if (q.includes("latest students"))
    return "LATEST_STUDENTS";
  if (q.includes("show students")) return "SHOW_STUDENTS";

if (q.includes("latest students")) return "LATEST_STUDENTS";

if (q.includes("students in section")) return "STUDENTS_SECTION";

if (q.includes("students in cse") || q.includes("students in ece") || q.includes("students in it"))
  return "STUDENTS_BRANCH";

if (q.includes("latest forms")) return "LATEST_FORMS";

if (q.includes("top forms")) return "TOP_FORMS";

if (q.includes("submissions count")) return "TOTAL_SUBMISSIONS";

if (q.includes("most submissions"))
  return "GROUP_MOST_SUBMISSIONS";

  return "UNKNOWN";
}


/* -----------------------------
Generate SQL From Question
----------------------------- */
function generateSQL(question, schema) {

  const q = question.toLowerCase();

  if (q.includes("forms"))
    return "SELECT * FROM forms LIMIT 10";

  if (q.includes("groups"))
    return "SELECT * FROM `groups` LIMIT 10";

  if (q.includes("students"))
    return "SELECT * FROM students LIMIT 10";

  if (q.includes("submissions"))
    return "SELECT * FROM form_submissions LIMIT 10";

  if (q.includes("count forms"))
    return "SELECT COUNT(*) AS total FROM forms";

  if (q.includes("count students"))
    return "SELECT COUNT(*) AS total FROM students";

  if (q.includes("count groups"))
    return "SELECT COUNT(*) AS total FROM `groups`";

  return null;
}






/* -----------------------------
Extra Intent Detection
----------------------------- */
function detectExtraIntent(question) {

  const q = question;

  if (q.includes("count forms") || q.includes("give count forms"))
    return "COUNT_FORMS";

  if (q.includes("count groups"))
    return "COUNT_GROUPS";

  if (q.includes("count students"))
    return "COUNT_STUDENTS";

  if (q.includes("pending students"))
    return "PENDING_STUDENTS";

  if (q.includes("submissions count"))
    return "TOTAL_SUBMISSIONS";

  if (q === "help" || q.includes("what can you do"))
    return "HELP";

  return null;
}


/* -----------------------------
Get Database Schema
----------------------------- */
async function getSchema() {

  const [tables] = await db.promise().query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
  `);

  const schema = {};

  for (const t of tables) {

    const [cols] = await db.promise().query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      AND table_name = ?
    `,[t.table_name]);

    schema[t.table_name] = cols.map(c => c.column_name);
  }

  return schema;
}

/* -----------------------------
Smart AI SQL
----------------------------- */
async function runAISQL(question) {

  const q = question.toLowerCase();

  let sql = null;
  let mode = "table";

  /* ---------- FORMS ---------- */

  if (q.includes("forms") || q.includes("form name")) {

    sql = `
      SELECT title
      FROM forms
      ORDER BY created_at DESC
      LIMIT 10
    `;

    mode = "list";
  }

  /* ---------- GROUPS ---------- */

  else if (q.includes("groups") || q.includes("group name")) {

    sql = `
      SELECT name
      FROM \`groups\`
      ORDER BY name
    `;

    mode = "list";
  }

  /* ---------- STUDENTS ---------- */

  else if (q.includes("students")) {

    sql = `
    SELECT full_name, reg_no, branch, section
 FROM users
 WHERE role='student'
      LIMIT 20
    `;

    mode = "list";
  }

  /* ---------- SUBMISSIONS ---------- */

  else if (q.includes("submissions")) {

    sql = `
      SELECT id, form_id, created_at
      FROM form_submissions
      ORDER BY created_at DESC
      LIMIT 10
    `;
  }

  if (!sql)
    return null;

  const [rows] = await db.promise().query(sql);

  if (!rows || rows.length === 0)
    return "No data found in database.";

  /* ---------- LIST MODE ---------- */

  if (mode === "list") {

    const key = Object.keys(rows[0])[0];

    return rows
      .map((r, i) => `${i + 1}. ${r[key]}`)
      .join("\n");
  }

  /* ---------- TABLE MODE ---------- */

  return rows
    .map((r, i) =>
      `${i + 1}. ` +
      Object.keys(r).map(k => `${k}: ${r[k]}`).join(" | ")
    )
    .join("\n");
}

/* -----------------------------
Main AI Function
----------------------------- */
export async function askAI(question) {
  try {
    const cleanQuestion = normalizeQuestion(question);

    let intent = detectIntent(cleanQuestion);
    console.log("AI Question:", cleanQuestion);
console.log("Detected Intent:", intent);
    
    if (intent === "UNKNOWN") {
      const extraIntent = detectExtraIntent(cleanQuestion);
      if (extraIntent) intent = extraIntent;
    }

    switch (intent) {

      case "LIST_FORMS": {
        const [rows] = await db.promise().query(
          "SELECT title FROM forms ORDER BY created_at DESC"
        );
        return rows.map((r, i) => `${i + 1}. ${r.title}`).join("\n");
      }

      case "LIST_GROUPS": {
        const [rows] = await db.promise().query(
          "SELECT name FROM `groups` ORDER BY name"
        );
        return rows.map((r, i) => `${i + 1}. ${r.name}`).join("\n");
      }

      case "COUNT_FORMS": {
        const [[row]] = await db.promise().query(
          "SELECT COUNT(*) total FROM forms"
        );
        return `Total forms: ${row.total}`;
      }

      case "COUNT_GROUPS": {
        const [[row]] = await db.promise().query(
          "SELECT COUNT(*) total FROM `groups`"
        );
        return `Total groups: ${row.total}`;
      }

      case "COUNT_STUDENTS": {

        const [[row]] = await db.promise().query(`
          SELECT COUNT(*) total
          FROM users
          WHERE role='student'
        `);
      
        return `Total students: ${row.total}`;
      }
      case "TOP_STUDENTS": {
        const [rows] = await db.promise().query(`
          SELECT u.full_name, COUNT(fs.id) submissions
FROM users u
LEFT JOIN form_submissions fs
ON u.id = fs.student_id
WHERE u.role='student'
GROUP BY u.id
ORDER BY submissions DESC
LIMIT 5
        `);
        return formatTable(rows);
      }

      case "STUDENTS_PER_GROUP": {

        const [rows] = await db.promise().query(`
          SELECT 
            CONCAT(degree,' - ',branch,' - ',year,' Year - Section ',section) AS group_name,
            COUNT(*) AS students
          FROM users
          WHERE role='student'
          GROUP BY degree, branch, year, section
        `);
      
        return formatTable(rows);
      }

      case "GROUP_WITH_MOST_STUDENTS": {
        const [rows] = await db.promise().query(`
          SELECT g.name, COUNT(gm.user_id) AS students
          FROM \`groups\` g
          LEFT JOIN group_members gm
          ON g.id = gm.group_id
          GROUP BY g.id
          ORDER BY students DESC
          LIMIT 1
        `);
        return formatTable(rows);
      }

      case "LOWEST_FORM": {
        const [rows] = await db.promise().query(`
          SELECT f.title, COUNT(fs.id) AS submissions
          FROM forms f
          LEFT JOIN form_submissions fs
          ON f.id = fs.form_id
          GROUP BY f.id
          ORDER BY submissions ASC
          LIMIT 1
        `);
        return formatTable(rows);
      }
      case "HIGHEST_FORM": {
        const [rows] = await db.promise().query(`
          SELECT f.title, COUNT(fs.id) AS submissions
          FROM forms f
          LEFT JOIN form_submissions fs
          ON f.id = fs.form_id
          GROUP BY f.id
          ORDER BY submissions ASC
          LIMIT 1
        `);
        return formatTable(rows);
      }

      case "STUDENTS_NOT_SUBMITTED": {

        const formNameMatch = question.match(/submit (.+?) form/i);
      
        let formTitle = formNameMatch ? formNameMatch[1] : "";
      
        const [rows] = await db.promise().query(`
          SELECT u.full_name, u.reg_no
          FROM users u
          WHERE u.role='student'
          AND u.id NOT IN (
            SELECT fs.student_id
            FROM form_submissions fs
            JOIN forms f ON fs.form_id = f.id
            WHERE f.title LIKE ?
          )
        `,[`%${formTitle}%`]);
      
        return formatTable(rows);
      }

      case "STUDENTS_BY_SECTION": {

        const sectionMatch = question.match(/section\s+([a-z])/i);
      
        const section = sectionMatch ? sectionMatch[1].toUpperCase() : "";
      
        const [rows] = await db.promise().query(`
          SELECT full_name, reg_no, branch
          FROM users
          WHERE role='student'
          AND section = ?
        `,[section]);
      
        return formatTable(rows);
      }
      case "GROUP_MOST_SUBMISSIONS": {

        const [rows] = await db.promise().query(`
          SELECT g.name, COUNT(fs.id) AS submissions
          FROM \`groups\` g
          LEFT JOIN group_members gm ON g.id = gm.group_id
          LEFT JOIN form_submissions fs ON gm.user_id = fs.student_id
          GROUP BY g.id
          ORDER BY submissions DESC
          LIMIT 1
        `);
      
        return formatTable(rows);
      }
      case "PENDING_STUDENTS_FORM": {

        const formMatch = question.match(/for (.+?) form/i);
        const formTitle = formMatch ? formMatch[1] : "";
      
        const [rows] = await db.promise().query(`
          SELECT u.full_name, u.reg_no
          FROM users u
          WHERE u.role='student'
          AND u.id NOT IN (
            SELECT fs.student_id
            FROM form_submissions fs
            JOIN forms f ON fs.form_id = f.id
            WHERE f.title LIKE ?
          )
        `,[`%${formTitle}%`]);
      
        return formatTable(rows);
      }
      case "STUDENTS_BY_BRANCH": {

        const branchMatch = question.match(/students in (\w+)/i);
        const branch = branchMatch ? branchMatch[1].toUpperCase() : "";
      
        const [rows] = await db.promise().query(`
          SELECT full_name, reg_no, section
          FROM users
          WHERE role='student'
          AND branch = ?
        `,[branch]);
      
        return formatTable(rows);
      }
      case "TOP_FORMS": {

        const [rows] = await db.promise().query(`
          SELECT f.title, COUNT(fs.id) AS submissions
          FROM forms f
          LEFT JOIN form_submissions fs
          ON f.id = fs.form_id
          GROUP BY f.id
          ORDER BY submissions DESC
          LIMIT 5
        `);
      
        return formatTable(rows);
      }
      case "LATEST_STUDENTS": {

        const [rows] = await db.promise().query(`
         SELECT full_name, reg_no, DATE(created_at) AS created_at
          FROM users
          WHERE role='student'
          ORDER BY created_at DESC
          LIMIT 10
        `);
      
        return formatTable(rows);
      }
      case "SHOW_STUDENTS": {

        const [rows] = await db.promise().query(`
          SELECT full_name, reg_no, branch, section
          FROM users
          WHERE role='student'
          LIMIT 20
        `);
      
        return rows
          .map((r,i)=>`${i+1}. ${r.full_name} | ${r.reg_no} | ${r.branch} | ${r.section}`)
          .join("\n");
      }
      case "STUDENTS_SECTION": {

        const sectionMatch = question.match(/section\s+([a-z])/i);
        const section = sectionMatch ? sectionMatch[1].toUpperCase() : "";
      
        const [rows] = await db.promise().query(`
          SELECT full_name, reg_no, branch
          FROM users
          WHERE role='student'
          AND section = ?
        `,[section]);
      
        return formatTable(rows);
      }
      case "STUDENTS_BRANCH": {

        const branchMatch = question.match(/students in (\w+)/i);
        const branch = branchMatch ? branchMatch[1].toUpperCase() : "";
      
        const [rows] = await db.promise().query(`
          SELECT full_name, reg_no, section
          FROM users
          WHERE role='student'
          AND branch = ?
        `,[branch]);
      
        return formatTable(rows);
      }
      case "LATEST_STUDENTS": {

        const [rows] = await db.promise().query(`
          SELECT full_name, reg_no, DATE(created_at) AS created_at
          FROM users
          WHERE role='student'
          ORDER BY created_at DESC
          LIMIT 10
        `);
      
        return formatTable(rows);
      }
      case "LATEST_FORMS": {

        const [rows] = await db.promise().query(`
          SELECT title, created_at
          FROM forms
          ORDER BY created_at DESC
          LIMIT 10
        `);
      
        return formatTable(rows);
      }
      case "TOP_FORMS": {

        const [rows] = await db.promise().query(`
          SELECT f.title, COUNT(fs.id) AS submissions
          FROM forms f
          LEFT JOIN form_submissions fs
          ON f.id = fs.form_id
          GROUP BY f.id
          ORDER BY submissions DESC
          LIMIT 5
        `);
      
        return formatTable(rows);
      }
      case "TOTAL_SUBMISSIONS": {

        const [[row]] = await db.promise().query(`
          SELECT COUNT(*) AS total
          FROM form_submissions
        `);
      
        return `Total submissions: ${row.total}`;
      }
      case "GROUP_MOST_SUBMISSIONS": {

        const [rows] = await db.promise().query(`
          SELECT g.name, COUNT(fs.id) AS submissions
          FROM \`groups\` g
          LEFT JOIN group_members gm ON g.id = gm.group_id
          LEFT JOIN form_submissions fs ON gm.user_id = fs.student_id
          GROUP BY g.id
          ORDER BY submissions DESC
          LIMIT 1
        `);
      
        return formatTable(rows);
      }
      
      case "HELP":
        return `
        🤖 FormFlow AI Assistant
        
        You can ask questions like:
        
        📄 Forms
        • list forms
        • show latest forms
        • which form has lowest submissions
    
        
        👨‍🎓 Students
        • show students
        • show students in section A
        • students in CSE
        • latest students
        • which students didn't submit Deloitte form

        
        👥 Groups
        • list groups
        • students per group
        • which group has most submissions
        
        📊 Analytics
        • count students
        • count forms
        • top forms
        • submissions count
        `;
      
      default: {

      const aiResult = await runAISQL(question);
      
        if (aiResult)
          return aiResult;
      
        return "I couldn't understand the question. Try asking about forms, groups, students or submissions.";
      
      }
    }
  } catch (err) {
    console.error("AI system error:", err);
    return "System error while processing request.";
  }
}
