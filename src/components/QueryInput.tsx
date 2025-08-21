
import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QueryInputProps {
  query: string;
  setQuery: (query: string) => void;
  chartType: string;
  setChartType: (type: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const QueryInput = ({ 
  query, 
  setQuery, 
  chartType, 
  setChartType, 
  onGenerate, 
  isLoading 
}: QueryInputProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onGenerate();
    }
  };

  return (
    <div className="municipal-card mb-6">
      <div className="municipal-card-header">
        <h2 className="text-lg font-semibold text-slate-800">
          Natural Language Query
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Ask questions about municipal complaints in plain English
        </p>
      </div>
      <div className="municipal-card-body">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-slate-700 mb-2">
              Your Question
            </label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Show water leak complaints by ward for the last 6 months"
              className="municipal-input min-h-[100px] resize-y"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="chartType" className="block text-sm font-medium text-slate-700 mb-2">
                Chart Type
              </label>
              <Select value={chartType} onValueChange={setChartType} disabled={isLoading}>
                <SelectTrigger className="municipal-input h-12 p-3">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 shadow-lg">
                  <SelectItem value="auto">Auto (Recommended)</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="doughnut">Doughnut Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="btn-municipal-primary h-12 px-8 flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Generate Chart</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QueryInput;
