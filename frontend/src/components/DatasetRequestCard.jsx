export default function DatasetRequestCard({ request }) {
  return <div>{request?.title || 'Dataset Request'}</div>
}
