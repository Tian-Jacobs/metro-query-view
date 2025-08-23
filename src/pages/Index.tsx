
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import QuerySidebar from '@/components/QuerySidebar';
import QueryInput from '@/components/QueryInput';
import ChartDisplay from '@/components/ChartDisplay';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AuthDialog from '@/components/AuthDialog';
import AuthStatus from '@/components/AuthStatus';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface ChartData {
  chartType: string;
  data: any;
  title: string;
  totalRecords: number;
  sql?: string;
  dataPreview?: any[];
}

const Index = () => {
  const [query, setQuery] = useState('');
  const [chartType, setChartType] = useState('auto');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const { session, profile, role, loading, signIn, signUp, signOut } = useSupabaseAuth();

  const handleQuerySelect = (selectedQuery: string) => {
    setQuery(selectedQuery);
  };

  const generateMockData = (query: string): ChartData => {
    // Mock data generator based on query content
    if (query.toLowerCase().includes('category')) {
      return {
        chartType: 'bar',
        title: 'Complaints by Category',
        totalRecords: 245,
        data: [
          { name: 'Water Leak', value: 45 },
          { name: 'Pothole', value: 38 },
          { name: 'Housing', value: 32 },
          { name: 'Electrical', value: 28 },
          { name: 'Waste Management', value: 22 }
        ],
        sql: 'SELECT category_name, COUNT(*) as complaint_count FROM complaints GROUP BY category_name ORDER BY complaint_count DESC',
        dataPreview: [
          { category: 'Water Leak', count: 45, avg_resolution_days: 3.2 },
          { category: 'Pothole', count: 38, avg_resolution_days: 5.1 },
          { category: 'Housing', count: 32, avg_resolution_days: 12.4 }
        ]
      };
    } else if (query.toLowerCase().includes('ward')) {
      return {
        chartType: 'pie',
        title: 'Complaints by Ward',
        totalRecords: 189,
        data: [
          { name: 'Ward 1', value: 34 },
          { name: 'Ward 2', value: 28 },
          { name: 'Ward 3', value: 31 },
          { name: 'Ward 4', value: 25 },
          { name: 'Ward 5', value: 37 },
          { name: 'Ward 6', value: 34 }
        ],
        sql: 'SELECT ward_name, COUNT(*) as complaint_count FROM complaints c JOIN wards w ON c.ward_id = w.id GROUP BY ward_name',
        dataPreview: [
          { ward: 'Ward 1', complaints: 34, population: 12500, rate: 2.7 },
          { ward: 'Ward 2', complaints: 28, population: 11800, rate: 2.4 }
        ]
      };
    } else if (query.toLowerCase().includes('trend') || query.toLowerCase().includes('monthly')) {
      return {
        chartType: 'line',
        title: 'Monthly Complaints Trend',
        totalRecords: 324,
        data: [
          { name: 'Jan', value: 23 },
          { name: 'Feb', value: 18 },
          { name: 'Mar', value: 31 },
          { name: 'Apr', value: 28 },
          { name: 'May', value: 35 },
          { name: 'Jun', value: 42 },
          { name: 'Jul', value: 38 },
          { name: 'Aug', value: 29 }
        ],
        sql: 'SELECT DATE_FORMAT(created_at, "%b") as month, COUNT(*) as complaint_count FROM complaints WHERE YEAR(created_at) = 2024 GROUP BY MONTH(created_at) ORDER BY MONTH(created_at)',
        dataPreview: [
          { month: 'January', complaints: 23, resolved: 19, pending: 4 },
          { month: 'February', complaints: 18, resolved: 16, pending: 2 }
        ]
      };
    } else if (query.toLowerCase().includes('resolution')) {
      return {
        chartType: 'doughnut',
        title: 'Resolution Rate by Category',
        totalRecords: 156,
        data: [
          { name: 'Resolved', value: 78 },
          { name: 'In Progress', value: 12 },
          { name: 'Pending', value: 10 }
        ],
        sql: 'SELECT status, COUNT(*) as count FROM complaints GROUP BY status',
        dataPreview: [
          { status: 'Resolved', count: 78, avg_days: 4.2 },
          { status: 'In Progress', count: 12, avg_days: 2.1 }
        ]
      };
    } else {
      return {
        chartType: 'bar',
        title: 'General Complaint Analysis',
        totalRecords: 198,
        data: [
          { name: 'Item A', value: 35 },
          { name: 'Item B', value: 28 },
          { name: 'Item C', value: 22 },
          { name: 'Item D', value: 19 }
        ],
        sql: 'SELECT category, COUNT(*) as count FROM complaints GROUP BY category ORDER BY count DESC',
        dataPreview: [
          { item: 'Item A', value: 35, percentage: 17.7 },
          { item: 'Item B', value: 28, percentage: 14.1 }
        ]
      };
    }
  };

  const handleGenerate = async () => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a query to generate a chart.",
        variant: "destructive"
      });
      return;
    }

    // Require authentication and proper role
    if (!session?.access_token) {
      toast({
        title: "Sign in required",
        description: "Please sign in to generate charts.",
      });
      setAuthOpen(true);
      return;
    }
    if (!['staff', 'admin'].includes(role)) {
      toast({
        title: "Access denied",
        description: "Only staff and admin users can generate charts.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-chart', {
        body: {
          prompt: query,
          chartType: chartType === 'auto' ? undefined : chartType,
        },
      });

      if (fnError) {
        const errorMessage = fnError.message || "Failed to generate chart. Please try again or contact support.";
        setError(errorMessage);
        toast({
          title: "Generation Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (!data) {
        const errorMessage = "No data returned from generator.";
        setError(errorMessage);
        toast({
          title: "No Data",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      const payload = data as ChartData;
      setChartData(payload);

      toast({
        title: "Chart Generated",
        description: `Successfully created ${payload.chartType} chart with ${payload.totalRecords} records.`,
      });
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to generate chart. Please try again or contact support.";
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Analytics Dashboard</h2>
          <p className="text-slate-600">
            Generate insights from municipal complaints data using natural language queries.
          </p>
        </div>
        <AuthStatus
          email={profile?.email ?? session?.user?.email}
          role={role}
          onSignInClick={() => setAuthOpen(true)}
          onSignOut={() => signOut()}
          loading={loading}
        />
      </div>

      <div className="px-6">
        {session && !['staff', 'admin'].includes(role) && (
          <div className="mt-4 rounded-md border p-3 text-sm">
            You are signed in as <span className="font-medium">{profile?.email ?? session.user.email}</span> with role "<span className="font-medium">{role}</span>".
            Only staff and admin can generate charts. Ask an administrator to update your role.
          </div>
        )}
      </div>

      <QuerySidebar onQuerySelect={handleQuerySelect} />
      
      <main className="flex-1 p-6 max-w-6xl">
        <QueryInput
          query={query}
          setQuery={setQuery}
          chartType={chartType}
          setChartType={setChartType}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />

        <ChartDisplay
          data={chartData}
          isLoading={isLoading}
          error={error}
        />
      </main>

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSignIn={signIn}
        onSignUp={signUp}
      />
    </DashboardLayout>
  );
};

export default Index;
