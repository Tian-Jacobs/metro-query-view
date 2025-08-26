
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface QueryResultProps {
  data: any[];
  title: string;
  totalRecords: number;
}

const QueryResult = ({ data, title, totalRecords }: QueryResultProps) => {
  if (!data || data.length === 0) {
    return null;
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const displayData = data.slice(0, 100); // Show max 100 rows

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">Query Result</h3>
      <p className="text-sm text-slate-600 mb-4">
        {totalRecords} total records
      </p>
      
      <div className="municipal-card">
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
      </div>
    </div>
  );
};

export default QueryResult;
