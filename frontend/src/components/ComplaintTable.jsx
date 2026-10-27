export default function ComplaintTable({ complaints = [] }) {
  return (
    <table>
      <tbody>
        {complaints.map((item) => (
          <tr key={item.id || item.title}>
            <td>{item.title}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
