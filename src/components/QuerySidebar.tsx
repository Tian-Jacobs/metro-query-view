
import React from 'react';
import { Search, Clock, Star, TrendingUp, MapPin, Wrench, Home, Zap } from 'lucide-react';

interface QuerySidebarProps {
  onQuerySelect: (query: string) => void;
}

const QuerySidebar = ({ onQuerySelect }: QuerySidebarProps) => {
  const sampleQueries = [
    {
      category: "Overview",
      icon: TrendingUp,
      queries: [
        "Show complaints by category",
        "Monthly complaints trend",
        "Complaints status distribution"
      ]
    },
    {
      category: "Geographic",
      icon: MapPin,
      queries: [
        "Complaints by ward",
        "Ward with most pothole complaints",
        "Water leak complaints by neighborhood"
      ]
    },
    {
      category: "Infrastructure",
      icon: Wrench,
      queries: [
        "Water leak complaints over time",
        "Pothole reports by month",
        "Streetlight repair complaints over time" // replaced to fit available categories
      ]
    },
    {
      category: "Performance",
      icon: Star,
      queries: [
        "Resolution rate by category",
        "Average resolution time by category",
        "Peak complaint submission months"
      ]
    },
    {
      category: "Residents",
      icon: Home,
      queries: [
        "Top 5 residents with most complaints",
        "Housing application status",
        "Repeat complainants analysis"
      ]
    }
  ];

  const recentQueries = [
    "Show water leak complaints by ward",
    "Monthly complaint trends for 2024",
    "Resolution time analysis"
  ];

  return (
    <div className="w-80 municipal-sidebar p-6 overflow-y-auto bg-background">
      {/* Search Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="w-5 h-5 text-slate-600" />
          <h2 className="font-semibold text-slate-800">Query Assistant</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Click on any sample query below or type your own natural language question.
        </p>
      </div>

      {/* Recent Queries */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-4 h-4 text-slate-500" />
          <h3 className="font-medium text-slate-700">Recent Queries</h3>
        </div>
        <div className="space-y-2">
          {recentQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => onQuerySelect(query)}
              className="w-full text-left p-3 text-sm text-slate-600 hover:bg-white hover:text-blue-700 rounded-lg transition-colors duration-200 border border-transparent hover:border-blue-200"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      {/* Sample Queries by Category */}
      <div className="space-y-6">
        <h3 className="font-medium text-slate-700">Sample Queries</h3>
        {sampleQueries.map((category) => (
          <div key={category.category}>
            <div className="flex items-center space-x-2 mb-3">
              <category.icon className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-slate-700 text-sm">
                {category.category}
              </h4>
            </div>
            <div className="space-y-1 ml-6">
              {category.queries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => onQuerySelect(query)}
                  className="w-full text-left p-2 text-sm text-slate-600 hover:bg-white hover:text-blue-700 rounded-md transition-colors duration-200 border border-transparent hover:border-blue-200"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuerySidebar;
