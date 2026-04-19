export const schema = `

TABLE: groups
- id
- name
- created_at

TABLE: students
- id
- name
- email
- group_id

TABLE: group_members
- id
- group_id
- user_id

TABLE: forms
- id
- title
- created_at

TABLE: form_submissions
- id
- form_id
- student_id
- status
- created_at

RELATIONSHIPS:

groups.id = group_members.group_id
groups.id = students.group_id
students.id = form_submissions.student_id
forms.id = form_submissions.form_id

`;