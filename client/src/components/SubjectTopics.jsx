import { useState } from 'react';

const SubjectTopics = ({ subject, addTopic, toggleTopicCompletion }) => {
  const [newTopicTitle, setNewTopicTitle] = useState('');

  const handleAddTopic = (event) => {
    event.preventDefault();

    const trimmedTitle = newTopicTitle.trim();
    if (!trimmedTitle) return;

    addTopic(subject.id, trimmedTitle);
    setNewTopicTitle('');
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-xl font-bold text-slate-900">{subject.name}</h3>

      <ul className="mb-4 space-y-2">
        {subject.topics?.length ? (
          subject.topics.map((topic) => (
            <li
              key={topic.id}
              className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={Boolean(topic.completed)}
                onChange={() => toggleTopicCompletion(subject.id, topic.id)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-300"
              />

              <span
                className={`text-sm text-slate-700 ${topic.completed ? 'line-through text-slate-400' : ''}`}
              >
                {topic.title}
              </span>
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-500">No topics yet. Add your first topic below.</li>
        )}
      </ul>

      <form onSubmit={handleAddTopic} className="flex gap-2">
        <input
          type="text"
          value={newTopicTitle}
          onChange={(event) => setNewTopicTitle(event.target.value)}
          placeholder="Add a new topic"
          className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        />

        <button
          type="submit"
          className="h-10 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          Add Topic
        </button>
      </form>
    </section>
  );
};

export default SubjectTopics;
