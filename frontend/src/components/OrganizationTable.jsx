export default function OrganizationTable({ organizations = [] }) {
  return (
    <table>
      <tbody>
        {organizations.map((item) => (
          <tr key={item.id || item.name}>
            <td>{item.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
