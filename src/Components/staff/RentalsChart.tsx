import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../../styles/RentalsChart.css';

const timePeriods = ['Año', 'Mes', 'Semana', 'Dia', 'Otro'];

// Datos de ejemplo para la gráfica
const generateSampleData = (period: string) => {
  const data = [];
  const count = period === 'Dia' ? 24 : period === 'Semana' ? 7 : period === 'Mes' ? 30 : 12;
  
  for (let i = 0; i < count; i++) {
    data.push({
      name: period === 'Dia' ? `${i}:00` : period === 'Semana' ? `Día ${i + 1}` : period === 'Mes' ? `Día ${i + 1}` : `Mes ${i + 1}`,
      rentas: Math.floor(Math.random() * 50) + 10,
    });
  }
  return data;
};

const RentalsChart = () => {
  const [activePeriod, setActivePeriod] = useState('Mes');
  const chartData = useMemo(() => generateSampleData(activePeriod), [activePeriod]);

  return (
    <div className="rentals-chart-container">
      <div className="chart-header">
        <h2 className="chart-title">Resumen de Rentas:</h2>
        <div className="period-selector">
          {timePeriods.map((period) => (
            <button
              key={period}
              className={`period-button ${activePeriod === period ? 'active' : ''}`}
              onClick={() => setActivePeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="name" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #DE78DE',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="rentas" 
              stroke="#7C107C" 
              strokeWidth={3}
              dot={{ fill: '#7C107C', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RentalsChart;

