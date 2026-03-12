import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value));

const WeeklyAnalytics = ({ subjects = [] }) => {
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const isoDate = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

    return {
      isoDate,
      dayNumber,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  });

  const dateIndexMap = new Map(last7Days.map((day, index) => [day.isoDate, index]));
  const dayNumberIndexMap = new Map(last7Days.map((day, index) => [day.dayNumber, index]));
  const completionsByDay = Array(7).fill(0);

  subjects.forEach((subject) => {
    const topics = Array.isArray(subject?.topics) ? subject.topics : [];

    topics.forEach((topic) => {
      if (!topic?.completed) return;

      const completedDate = String(topic?.completedDate || '');
      if (isIsoDate(completedDate) && dateIndexMap.has(completedDate)) {
        const dateIndex = dateIndexMap.get(completedDate);
        completionsByDay[dateIndex] += 1;
        return;
      }

      const dayNumber = Number(topic?.id);
      if (!Number.isInteger(dayNumber) || !dayNumberIndexMap.has(dayNumber)) return;

      const dayIndex = dayNumberIndexMap.get(dayNumber);
      completionsByDay[dayIndex] += 1;
    });
  });

  const data = {
    labels: last7Days.map((day) => day.label),
    datasets: [
      {
        label: 'Daily Completions',
        data: completionsByDay,
        tension: 0.35,
        fill: true,
        borderColor: 'rgba(99, 102, 241, 0.95)',
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        pointBackgroundColor: 'rgba(99, 102, 241, 0.95)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Last 7 Days Study Productivity',
        color: '#1e293b',
        font: {
          size: 16,
          weight: '600',
        },
        padding: {
          bottom: 16,
        },
      },
      tooltip: {
        backgroundColor: '#334155',
        displayColors: false,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#475569',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: '#475569',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.22)',
        },
      },
    },
  };

  return (
    <section className="w-full rounded-3xl border border-white/70 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-6">
      <div className="h-72 w-full sm:h-80">
        <Line data={data} options={options} />
      </div>
    </section>
  );
};

export default WeeklyAnalytics;
