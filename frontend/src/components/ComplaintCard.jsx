export default function ComplaintCard({ complaint }) {
  return <div>{complaint?.title || 'Complaint'}</div>
}
