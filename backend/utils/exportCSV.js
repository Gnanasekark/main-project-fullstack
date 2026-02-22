import { Parser } from "json2csv";

export const exportToCSV = (data, res) => {
  const parser = new Parser();
  const csv = parser.parse(data);

  res.header("Content-Type", "text/csv");
  res.attachment("notifications.csv");
  res.send(csv);
};