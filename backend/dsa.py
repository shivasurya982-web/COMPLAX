import heapq

class PriorityQueue:
    def __init__(self):
        self._queue = []
        self._index = 0

    def insert(self, item, priority_str):
        # Priority: High = 1, Medium = 2, Low = 3
        priority_map = {"High": 1, "Medium": 2, "Low": 3}
        priority = priority_map.get(priority_str, 3)
        # heapq is a min-heap, so 1 will be popped before 2 and 3
        # We use self._index to maintain insertion order for same priority
        heapq.heappush(self._queue, (priority, self._index, item))
        self._index += 1

    def remove(self):
        if self.is_empty():
            return None
        return heapq.heappop(self._queue)[-1]

    def peek(self):
        if self.is_empty():
            return None
        return self._queue[0][-1]

    def is_empty(self):
        return len(self._queue) == 0

    def size(self):
        return len(self._queue)

    def get_all_sorted(self):
        # Return items in priority order without emptying the queue
        return [item for prio, idx, item in sorted(self._queue)]
