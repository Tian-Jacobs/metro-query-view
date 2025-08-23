
import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TablePreview from './TablePreview';

interface ChartData {
  chartType: string;
  data: any;
  title: string;
  totalRecords: number;
  sql?: string;
  dataPreview?: any[];
}

interface ChartDisplayProps {
  data: ChartData | null;
  isLoading: boolean;
  error: string | null;
}

const ChartDisplay = ({ data, isLoading, error }: ChartDisplayProps) => {
  // Enhanced color palette with better variety and accessibility - Municipal theme
  const COLORS = [
    'hsl(221, 83%, 53%)',   // Primary Blue
    'hsl(142, 76%, 36%)',   // Primary Green
    'hsl(32, 95%, 44%)',    // Orange accent
    'hsl(262, 83%, 58%)',   // Purple
    'hsl(193, 95%, 68%)',   // Cyan
    'hsl(84, 81%, 44%)',    // Lime
    'hsl(231, 48%, 48%)',   // Indigo
    'hsl(173, 58%, 39%)',   // Teal
    'hsl(25, 95%, 53%)',    // Deep Orange
    'hsl(204, 94%, 64%)',   // Light Blue
    'hsl(291, 64%, 42%)',   // Violet
    'hsl(43, 96%, 56%)',    // Amber
    'hsl(348, 83%, 47%)',   // Red
    'hsl(316, 73%, 52%)',   // Pink
    'hsl(14, 100%, 57%)',   // Red Orange
  ];

  // Chart color configuration - Municipal theme
  const chartColors = {
    primary: 'hsl(221, 83%, 53%)',
    secondary: 'hsl(142, 76%, 36%)',
    accent: 'hsl(32, 95%, 44%)',
    grid: 'hsl(215, 20%, 65%)',
    text: 'hsl(215, 25%, 27%)',
    background: 'hsl(0, 0%, 100%)',
    border: 'hsl(214, 32%, 91%)'
  };

  const handleExport = () => {
    if (!data) return;

    // Create CSV content
    const csvContent = data.data
      .map((row: any) => `${row.name},${row.value}`)
      .join('\n');
    
    const header = 'Category,Value\n';
    const fullCsvContent = header + csvContent;

    // Create and download file
    const blob = new Blob([fullCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${data.title.replace(/\s+/g, '_').toLowerCase()}_data.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom tick formatter to wrap long text
  const formatTick = (value: string) => {
    if (value.length > 12) {
      return value.substring(0, 10) + '...';
    }
    return value;
  };

  // Custom label formatter for tooltips to show full names
  const formatTooltipLabel = (label: string) => {
    return label;
  };

  if (isLoading) {
    return (
      <div className="municipal-card">
        <div className="municipal-card-body">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="municipal-loading w-16 h-16 rounded-full mb-4 mx-auto"></div>
              <p className="text-slate-600">Generating your chart...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="municipal-card border-red-200 bg-red-50">
        <div className="municipal-card-body">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠</span>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Unable to Generate Chart
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="text-sm text-red-700 bg-red-100 p-3 rounded-lg">
              <strong>Suggestions:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Try rephrasing your query</li>
                <li>Check for typos in category or field names</li>
                <li>Use one of the sample queries as a starting point</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="municipal-card">
        <div className="municipal-card-body">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Ready to Generate Charts
            </h3>
            <p className="text-slate-500">
              Enter a natural language query above to get started
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    const chartData = data.data;
    
    switch (data.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={450}>
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke={chartColors.text} 
                fontSize={11}
                tick={{ fill: chartColors.text }}
                tickFormatter={formatTick}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                stroke={chartColors.text} 
                fontSize={12}
                tick={{ fill: chartColors.text }}
              />
              <Tooltip 
                labelFormatter={formatTooltipLabel}
                contentStyle={{ 
                  backgroundColor: chartColors.background, 
                  border: `1px solid ${chartColors.border}`,
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  color: chartColors.text
                }} 
              />
              <Legend wrapperStyle={{ color: chartColors.text }} />
              <Bar 
                dataKey="value" 
                fill={chartColors.primary} 
                radius={[6, 6, 0, 0]}
                stroke={chartColors.border}
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke={chartColors.text}
                fontSize={12}
                tick={{ fill: chartColors.text }}
              />
              <YAxis 
                stroke={chartColors.text}
                fontSize={12}
                tick={{ fill: chartColors.text }}
              />
              <Tooltip 
                labelFormatter={formatTooltipLabel}
                contentStyle={{ 
                  backgroundColor: chartColors.background, 
                  border: `1px solid ${chartColors.border}`,
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  color: chartColors.text
                }} 
              />
              <Legend wrapperStyle={{ color: chartColors.text }} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={chartColors.primary} 
                strokeWidth={3}
                dot={{ 
                  fill: chartColors.primary, 
                  strokeWidth: 2, 
                  r: 6,
                  stroke: chartColors.background
                }}
                activeDot={{ 
                  r: 8, 
                  fill: chartColors.secondary,
                  stroke: chartColors.background,
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={data.chartType === 'doughnut' ? 70 : 0}
                outerRadius={180}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => {
                  const shortName = name.length > 15 ? name.substring(0, 12) + '...' : name;
                  return `${shortName} ${(percent * 100).toFixed(1)}%`;
                }}
                labelLine={false}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke={chartColors.background}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={formatTooltipLabel}
                contentStyle={{ 
                  backgroundColor: chartColors.background, 
                  border: `1px solid ${chartColors.border}`,
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  color: chartColors.text
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <ResponsiveContainer width="100%" height={450}>
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke={chartColors.text}
                fontSize={11}
                tick={{ fill: chartColors.text }}
                tickFormatter={formatTick}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                stroke={chartColors.text}
                fontSize={12}
                tick={{ fill: chartColors.text }}
              />
              <Tooltip 
                labelFormatter={formatTooltipLabel}
                contentStyle={{ 
                  backgroundColor: chartColors.background, 
                  border: `1px solid ${chartColors.border}`,
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  color: chartColors.text
                }} 
              />
              <Legend wrapperStyle={{ color: chartColors.text }} />
              <Bar 
                dataKey="value" 
                fill={chartColors.primary} 
                radius={[6, 6, 0, 0]}
                stroke={chartColors.border}
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="municipal-card">
        <div className="municipal-card-header flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">
              {data.title}
            </h3>
            <p className="text-sm text-slate-600">
              {data.totalRecords} total records
            </p>
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm hover:shadow-md transition-all bg-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        <div className="municipal-card-body">
          {renderChart()}
        </div>
      </div>

      {/* Table Preview and SQL Query Display */}
      {data?.dataPreview && data.sql && (
        <TablePreview 
          data={data.dataPreview}
          title={data.title}
          sql={data.sql}
          totalRecords={data.totalRecords}
        />
      )}
    </div>
  );
};

export default ChartDisplay;
