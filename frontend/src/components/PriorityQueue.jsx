export default function PriorityQueue({ items = [] }) {
  return (
    <div>
      {items.map((item, index) => (
        <div key={item.id || index}>{item.title || 'Item'} </div>
      ))}
    </div>
  )
}
