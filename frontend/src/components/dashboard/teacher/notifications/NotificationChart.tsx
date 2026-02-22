import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  read: number;
  unread: number;
}

export default function NotificationChart({ read = 0, unread = 0 }: Props) {

  const total = read + unread;

  // Always show both sections
  const safeRead = total === 0 ? 1 : read;
  const safeUnread = total === 0 ? 0 : unread;

  const data = [
    { name: "Read", value: safeRead },
    { name: "Unread", value: safeUnread }
  ];

  const COLORS = ["#22c55e", "#facc15"]; // green + yellow

  return (
    <div className="w-full flex flex-col items-center">

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            outerRadius={110}
            label={({ percent }) =>
              total === 0
                ? ""
                : `${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend ALWAYS visible */}
      <div className="flex justify-center gap-8 mt-4 text-sm font-medium">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          Read - {read}
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
          Unread - {unread}
        </div>
      </div>

    </div>
  );
}