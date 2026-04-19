import ollama from "ollama"
import db from "../config/db.js"

/* READ DATABASE STRUCTURE */

async function getSchema(){

const [tables] = await db.promise().query(`
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
`)

let schema=""

for(const t of tables){

const table=t.TABLE_NAME

const [cols]=await db.promise().query(`
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME=?
`,[table])

schema+=`TABLE ${table}\n`

cols.forEach(c=>{
schema+=`- ${c.COLUMN_NAME}\n`
})

schema+="\n"

}

return schema
}

/* MAIN AI */

let cachedSchema = null

async function getCachedSchema(){
if(!cachedSchema){
cachedSchema = await getSchema()
}
return cachedSchema
}

export async function askLocalAI(question){

const schema = await getCachedSchema()

const prompt = `
You are a MySQL database assistant.

Database structure:

${schema}

Convert the user question into SQL query.

Return only SQL.

Question: ${question}
`

const res = await ollama.chat({
model:"phi3",
messages:[{role:"user",content:prompt}]
})

let sql=res.message.content
.replace(/```sql/g,"")
.replace(/```/g,"")
.trim()

const [rows] = await db.promise().query(sql)

/* RETURN ONLY NAME LIST */

return rows
.map((r,i)=>`${i+1}. ${r.name}`)
.join("\n")

}