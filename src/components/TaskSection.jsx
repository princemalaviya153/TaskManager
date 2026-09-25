import TaskItem from './TaskItem'

export default function TaskSection({ title, tone, tasks, action, ...itemProps }) {
  if (tasks.length === 0) return null
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className={`text-sm font-semibold ${tone === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
          {title} <span className="font-normal text-slate-400">{tasks.length}</span>
        </h2>
        {action}
      </div>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:divide-slate-800 dark:bg-slate-900 dark:ring-slate-800">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} {...itemProps} />
        ))}
      </ul>
    </section>
  )
}
