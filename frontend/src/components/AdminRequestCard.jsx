export default function AdminRequestCard({ request }) {
  return <div>{request?.title || 'Admin Request'}</div>
}
