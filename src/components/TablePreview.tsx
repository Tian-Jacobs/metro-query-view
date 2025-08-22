
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TablePreviewProps {
  data: any[];
  title: string;
  sql: string;
  totalRecords: number;
}

const TablePreview = ({ data, title, sql, totalRecords }: TablePreviewProps) => {
  const [showPreview, setShowPreview] = React.useState(false);
  const [showSQL, setShowSQL] = React.useState(false);

  if (!data || data.length === 0) {
    return null;
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const displayData = data.slice(0, 100); // Show max 100 rows

  return (
    <div className="space-y-4">
      {/* Table Preview Section */}
      <div className="municipal-card">
        <div className="municipal-card-header">
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            className="flex items-center space-x-3 text-left w-full hover:text-blue-700 transition-colors group"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              {showPreview ? <EyeOff className="w-4 h-4 text-blue-700" /> : <Eye className="w-4 h-4 text-blue-700" />}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Table Preview: {title}</span>
              <p className="text-sm text-slate-500 mt-0.5">
                Showing {Math.min(displayData.length, 100)} of {totalRecords} rows
              </p>
            </div>
            <div className="ml-auto">
              <div className={`transform transition-transform ${showPreview ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </Button>
        </div>
        
        {showPreview && (
          <div className="municipal-card-body p-0">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-blue-50 z-10">
                  <TableRow className="border-b-2 border-blue-100">
                    {columns.map((column) => (
                      <TableHead key={column} className="font-semibold text-blue-800 bg-blue-50 capitalize min-w-32">
                        {column.replace(/_/g, ' ')}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.map((row, index) => (
                    <TableRow 
                      key={index} 
                      className={`hover:bg-blue-50 transition-colors border-b border-slate-100 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                      }`}
                    >
                      {columns.map((column, colIndex) => (
                        <TableCell key={colIndex} className="text-slate-700 font-medium py-3">
                          <div className="max-w-48 truncate" title={row[column]?.toString() || 'N/A'}>
                            {row[column] !== null && row[column] !== undefined ? row[column].toString() : 
                              <span className="text-slate-400 italic">N/A</span>
                            }
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {displayData.length >= 100 && totalRecords > 100 && (
              <div className="px-6 py-4 border-t border-blue-200 bg-blue-50 text-center">
                <p className="text-sm text-blue-700">
                  Showing first 100 rows of {totalRecords} total records
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SQL Query Display */}
      <div className="municipal-card">
        <div className="municipal-card-header">
          <Button
            onClick={() => setShowSQL(!showSQL)}
            variant="outline"
            className="flex items-center space-x-3 text-left w-full hover:text-green-700 transition-colors group"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Generated SQL Query</span>
              <p className="text-sm text-slate-500 mt-0.5">
                View the SQL query generated by Gemini AI
              </p>
            </div>
            <div className="ml-auto">
              <div className={`transform transition-transform ${showSQL ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </Button>
        </div>
        {showSQL && (
          <div className="municipal-card-body">
            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto border border-green-200">
              <pre className="text-sm text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                <code>{sql}</code>
              </pre>
            </div>
            <div className="mt-3 text-xs text-slate-600 bg-green-50 p-3 rounded-lg border border-green-200">
              <strong className="text-green-800">Note:</strong> This SQL query was automatically generated by Gemini AI from your natural language prompt.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TablePreview;
