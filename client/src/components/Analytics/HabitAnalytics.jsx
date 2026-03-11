import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const HabitAnalytics = ({ habits, completed }) => {
  const completionCounts = habits.map((habit) => {
    const habitPrefix = `${habit}-`;

    return Object.entries(completed).reduce((count, [key, isDone]) => {
      if (key.startsWith(habitPrefix) && isDone) {
        return count + 1;
      }

      return count;
    }, 0);
  });

  const data = {
    labels: habits,
    datasets: [
      {
        label: 'Completions',
        data: completionCounts,
        backgroundColor: [
          'rgba(56, 189, 248, 0.75)',
          'rgba(129, 140, 248, 0.75)',
          'rgba(251, 191, 36, 0.75)',
          'rgba(192, 132, 252, 0.75)',
          'rgba(251, 146, 60, 0.75)',
          'rgba(34, 197, 94, 0.75)',
        ],
        borderColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 8,
        borderWidth: 1.5,
        maxBarThickness: 48,
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
        text: 'Study Completion Analytics',
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
        padding: 10,
        displayColors: false,
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
        grid: {
          color: 'rgba(148, 163, 184, 0.22)',
        },
        ticks: {
          stepSize: 1,
          color: '#475569',
        },
      },
    },
  };

  return (
    <section className="w-full rounded-3xl border border-white/70 bg-white/75 p-5 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-6">
      <div className="h-72 w-full sm:h-80">
        <Bar data={data} options={options} />
      </div>
    </section>
  );
};

export default HabitAnalytics;
