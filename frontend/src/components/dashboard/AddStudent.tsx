import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function AddStudent() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    full_name: "",
    registration_no: "",
    email: "",
    mobile: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    await fetch("http://localhost:5000/api/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        group_id: id,
      }),
    });

    alert("Student added");
    navigate(-1);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Add Student</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="full_name"
          placeholder="Full Name"
          className="border p-2 w-full"
          onChange={handleChange}
        />
        <input
          name="registration_no"
          placeholder="Register No"
          className="border p-2 w-full"
          onChange={handleChange}
        />
        <input
          name="email"
          placeholder="Email"
          className="border p-2 w-full"
          onChange={handleChange}
        />
        <input
          name="mobile"
          placeholder="Mobile"
          className="border p-2 w-full"
          onChange={handleChange}
        />

        <button className="bg-blue-500 text-white px-4 py-2">
          Add Student
        </button>
      </form>
    </div>
  );
}