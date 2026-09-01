export default function OrganizationCard({ organization }) {
  return <div>{organization?.name || 'Organization'}</div>
}
