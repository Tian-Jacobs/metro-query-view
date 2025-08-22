
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChartType = "bar" | "line" | "pie" | "doughnut";

type Plan = {
  sql: string;
  chartType?: ChartType;
  title: string;
  nameColumn: string;
  valueColumn: string;
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. Please add it in Supabase Edge Function Secrets.");
}
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("SUPABASE_URL or SUPABASE_ANON_KEY/SERVICE_ROLE_KEY missing in environment.");
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

function safeParsePlan(text: string): Plan | null {
  // Extract first JSON object from the model's output
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    return obj;
  } catch {
    return null;
  }
}

function validateAndCleanSQL(sql: string): string | null {
  const cleanSql = sql.trim().toLowerCase();
  
  // Only allow SELECT statements
  if (!cleanSql.startsWith('select')) {
    return null;
  }
  
  // Block dangerous keywords
  const dangerousKeywords = [
    'drop', 'delete', 'update', 'insert', 'alter', 'create', 'truncate', 
    'exec', 'execute', 'sp_', 'xp_', 'pg_', 'information_schema'
  ];
  
  for (const keyword of dangerousKeywords) {
    if (cleanSql.includes(keyword)) {
      return null;
    }
  }
  
  return sql.trim();
}

function clampPlan(raw: any): Plan | null {
  if (!raw?.sql || typeof raw.sql !== 'string') return null;
  
  const cleanedSQL = validateAndCleanSQL(raw.sql);
  if (!cleanedSQL) return null;

  const chartType = ((): ChartType => {
    if (raw?.chartType && ["bar", "line", "pie", "doughnut"].includes(raw.chartType)) {
      return raw.chartType;
    }
    return "bar"; // default
  })();

  return {
    sql: cleanedSQL,
    chartType,
    title: raw?.title || "Generated Chart",
    nameColumn: raw?.nameColumn || "name",
    valueColumn: raw?.valueColumn || "value"
  };
}

async function askGeminiForPlan(prompt: string): Promise<Plan | null> {
  const system = `
You are a SQL query generator for a municipal complaints database. Generate SAFE SELECT-only queries.

Database Schema:
- complaints: complaint_id, category_id, resident_id, title, description, submission_date
- residents: resident_id, first_name, last_name, email, phone, ward
- service_categories: category_id, category_name
- status_logs: log_id, complaint_id, status, status_date

Return ONLY a JSON object with this structure:
{
  "sql": "SELECT category_name as name, COUNT(*) as value FROM service_categories sc JOIN complaints c ON sc.category_id = c.category_id GROUP BY category_name ORDER BY value DESC",
  "chartType": "bar" | "line" | "pie" | "doughnut",
  "title": "Chart Title",
  "nameColumn": "name",
  "valueColumn": "value"
}

Rules:
- ONLY SELECT statements allowed
- Always alias columns as "name" and "value" for charts
- Use proper JOINs between tables
- Include appropriate GROUP BY and ORDER BY clauses
- Choose appropriate chart type based on data
- Make the title descriptive

Examples:
- "complaints by category" → GROUP BY category with COUNT
- "complaints by ward" → JOIN residents, GROUP BY ward
- "monthly trends" → GROUP BY month/date
- "status breakdown" → JOIN status_logs, GROUP BY status
`.trim();

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${system}\n\nUser prompt: ${prompt}\n\nReturn ONLY the JSON object.` }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  };

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!resp.ok) {
    console.error("Gemini API error", resp.status, await resp.text());
    return null;
  }

  const data = await resp.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ?? "";

  console.log("Gemini response:", text);

  const parsed = safeParsePlan(text);
  if (!parsed) return null;
  return clampPlan(parsed);
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, chartType: desiredChartType, previewOnly } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'prompt' string." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ask Gemini to generate a SQL query
    const plan = await askGeminiForPlan(prompt);
    if (!plan) {
      return new Response(JSON.stringify({ error: "Could not generate a valid SQL query from the prompt." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Executing SQL:", plan.sql);

    // Execute the SQL query using Supabase's RPC function
    const { data, error } = await supabase.rpc('execute_raw_sql', {
      sql_query: plan.sql
    });

    if (error) {
      console.error("Supabase SQL error:", error);
      return new Response(JSON.stringify({ error: `SQL execution failed: ${error.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform the data for chart consumption
    const rawData = Array.isArray(data) ? data : [];
    const chartData = rawData.map((row: any) => {
      const result = row.result || row;
      return {
        name: result[plan.nameColumn] || result.name || 'Unknown',
        value: Number(result[plan.valueColumn] || result.value || 0)
      };
    });

    // Create data preview (show raw SQL results)
    const dataPreview = rawData.slice(0, 50).map((row: any, index: number) => {
      const result = row.result || row;
      return { row_number: index + 1, ...result };
    });

    const finalChartType = desiredChartType || plan.chartType;
    const totalRecords = chartData.length;

    const payload = {
      chartType: finalChartType,
      title: plan.title,
      totalRecords,
      data: chartData,
      sql: plan.sql,
      dataPreview: dataPreview.length > 0 ? dataPreview : undefined
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-chart unexpected error:", e?.message || e);
    return new Response(JSON.stringify({ error: "Unexpected error generating chart." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
