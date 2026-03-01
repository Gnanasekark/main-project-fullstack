import { useEffect, useState } from "react";

export default function AdminStudents() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/students-master")
      .then(res => res.json())
      .then(data => setStudents(data));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Uploaded Students</h2>

      <div className="overflow-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Reg No</th>
              <th>Mobile</th> 
              <th>Degree</th>
              <th>Branch</th>
              <th>Year</th>
              <th>Section</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s: any) => (
              <tr key={s.id} className="border-t">
                <td>{s.full_name}</td>
                <td>{s.email}</td>
                <td>{s.reg_no}</td>
                <td>{s.mobile}</td> 
                <td>{s.degree}</td>
                <td>{s.branch}</td>
                <td>{s.year}</td>
                <td>{s.section}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}