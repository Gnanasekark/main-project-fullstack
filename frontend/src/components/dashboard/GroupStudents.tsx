import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function GroupStudents() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
const [editStudent, setEditStudent] = useState<any>(null);
const [isAddOpen, setIsAddOpen] = useState(false);
const [newStudent, setNewStudent] = useState({
  full_name: "",
  email: "",
  mobile: "",
  registration_no: "",
  degree: "",
  branch: "",
  year: "",
  section: "",
});

const [groupDetails, setGroupDetails] = useState({
  degree: "",
  branch: "",
  year: "",
  section: "",
});
const loadGroupDetails = async () => {
  const res = await fetch(`http://localhost:5000/api/groups/${id}`);
  const data = await res.json();
  setGroupDetails(data);
};

useEffect(() => {
  loadStudents();
  loadGroupDetails();
}, []);

  const loadStudents = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/groups/${id}/students`
      );
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error(err);
    }
  };

 
  
  return (
    <div className="space-y-6">
     <h1 className="text-2xl font-bold">
  Group Students Database ({students.length})
</h1>

      <Card>
        <CardContent className="p-6">

          {/* Top Controls */}
          <div className="flex justify-between mb-4">
            <Input
              placeholder="Search student..."
              className="max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

<Button
  onClick={() => {
    setNewStudent({
      full_name: "",
      email: "",
      mobile: "",
      registration_no: "",
      degree: groupDetails.degree,
      branch: groupDetails.branch,
      year: groupDetails.year,
      section: groupDetails.section,
    });
    setIsAddOpen(true);
  }}
>
  + Add Student
</Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Reg No</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Mobile</th>
                  <th className="p-3 text-left">Degree</th>
                  <th className="p-3 text-left">Branch</th>
                  <th className="p-3 text-left">Year</th>
                  <th className="p-3 text-left">Section</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {students
                  .filter((s) =>
                    s.full_name
                      ?.toLowerCase()
                      .includes(search.toLowerCase())
                  )
                  .map((student) => (
                    <tr
                      key={student.id}
                      className="border-b hover:bg-muted/30"
                    >
                      <td className="p-3">{student.full_name}</td>
                      <td className="p-3">{student.reg_no}</td>
                      <td className="p-3">{student.email}</td>
                      <td className="p-3">{student.mobile}</td>
                      <td className="p-3">{student.degree}</td>
                      <td className="p-3">{student.branch}</td>
                      <td className="p-3">{student.year}</td>
                      <td className="p-3">{student.section}</td>

                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                        <Button
  variant="outline"
  onClick={() => {
    setEditStudent(student);
    setIsEditOpen(true);
  }}
>
  Edit
</Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                                if (confirm("Are you sure you want to delete this student?")) {
                                    const res = await fetch(
                                      `http://localhost:5000/api/students/${student.id}`,
                                      { method: "DELETE" }
                                    );
                                  
                                    if (res.ok) {
                                      toast.success("Student deleted successfully");
                                      loadStudents();
                                    } else {
                                      toast.error("Delete failed");
                                    }
                                  }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* EDIT STUDENT MODAL */}
{isEditOpen && editStudent && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4">

      <h2 className="text-lg font-bold">Edit Student</h2>

      <Input
        value={editStudent.full_name}
        onChange={(e) =>
          setEditStudent({ ...editStudent, full_name: e.target.value })
        }
        placeholder="Full Name"
      />

      <Input
        value={editStudent.email}
        onChange={(e) =>
          setEditStudent({ ...editStudent, email: e.target.value })
        }
        placeholder="Email"
      />

      <Input
        value={editStudent.mobile}
        onChange={(e) =>
          setEditStudent({ ...editStudent, mobile: e.target.value })
        }
        placeholder="Mobile"
      />
      <Input
  value={editStudent.reg_no || ""}
  onChange={(e) =>
    setEditStudent({ ...editStudent, reg_no: e.target.value })
  }
  placeholder="Registration No"
/>

<Input
  value={editStudent.degree || ""}
  onChange={(e) =>
    setEditStudent({ ...editStudent, degree: e.target.value })
  }
  placeholder="Degree"
/>

<Input
  value={editStudent.branch || ""}
  onChange={(e) =>
    setEditStudent({ ...editStudent, branch: e.target.value })
  }
  placeholder="Branch"
/>

<Input
  value={editStudent.year || ""}
  onChange={(e) =>
    setEditStudent({ ...editStudent, year: e.target.value })
  }
  placeholder="Year"
/>

<Input
  value={editStudent.section || ""}
  onChange={(e) =>
    setEditStudent({ ...editStudent, section: e.target.value })
  }
  placeholder="Section"
/>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setIsEditOpen(false)}
        >
          Cancel
        </Button>

        <Button
          onClick={async () => {
            const res = await fetch(
              `http://localhost:5000/api/students/${editStudent.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(editStudent),
              }
            );

            if (res.ok) {
              toast.success("Student updated successfully");
              setIsEditOpen(false);
              loadStudents();
            } else {
              toast.error("Update failed");
            }
          }}
        >
          Save Changes
        </Button>
      </div>
      

    </div>
  </div>
)}


        </CardContent>
      </Card>
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Student</DialogTitle>
    </DialogHeader>

    <div className="space-y-3">
      <Input
        placeholder="Full Name"
        value={newStudent.full_name}
        onChange={(e) =>
          setNewStudent({ ...newStudent, full_name: e.target.value })
        }
      />
      <Input
        placeholder="Email"
        value={newStudent.email}
        onChange={(e) =>
          setNewStudent({ ...newStudent, email: e.target.value })
        }
      />
      <Input
        placeholder="Mobile"
        value={newStudent.mobile}
        onChange={(e) =>
          setNewStudent({ ...newStudent, mobile: e.target.value })
        }
      />
      <Input
        placeholder="Register No"
        value={newStudent.registration_no}
        onChange={(e) =>
          setNewStudent({
            ...newStudent,
            registration_no: e.target.value,
          })
        }
      />
      <Input
        placeholder="Degree"
        value={newStudent.degree}
        onChange={(e) =>
          setNewStudent({ ...newStudent, degree: e.target.value })
        }
      />
      <Input
        placeholder="Branch"
        value={newStudent.branch}
        onChange={(e) =>
          setNewStudent({ ...newStudent, branch: e.target.value })
        }
      />
      <Input
        placeholder="Year"
        value={newStudent.year}
        onChange={(e) =>
          setNewStudent({ ...newStudent, year: e.target.value })
        }
      />
      <Input
        placeholder="Section"
        value={newStudent.section}
        onChange={(e) =>
          setNewStudent({ ...newStudent, section: e.target.value })
        }
      />
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsAddOpen(false)}>
        Cancel
      </Button>

      <Button
        onClick={async () => {
          const res = await fetch("http://localhost:5000/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...newStudent,
              group_id: id,
            }),
          });

          if (res.ok) {
            toast.success("Student added successfully");
            setIsAddOpen(false);
            loadStudents();
          } else {
            toast.error("Failed to add student");
          }
        }}
      >
        Save Student
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
    
  );
}