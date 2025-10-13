
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
  
  // Check for SQLite functions that don't exist in PostgreSQL
  const sqliteFunctions = ['strftime'];
  for (const func of sqliteFunctions) {
    if (cleanSql.includes(func)) {
      console.error(`SQLite function '${func}' detected in query. PostgreSQL syntax required.`);
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

async function isPromptRelevant(prompt: string): Promise<{ relevant: boolean; reason?: string }> {
  const validationPrompt = `
You are validating if a user prompt is relevant to a municipal complaints management system.

The system contains data about:
- Municipal complaints (title, description, submission dates, categories)
- Residents who filed complaints (name, email, ward)
- Service categories (water, electricity, roads, sanitation, etc.)
- Status logs (complaint status: Pending, In Progress, Resolved)

Relevant prompts ask about:
- Complaint trends, volumes, or patterns
- Status distributions or resolution times
- Category breakdowns or ward-based analysis
- Time-based complaint analysis (monthly, yearly trends)
- Resident or department statistics related to complaints

Irrelevant prompts ask about:
- Unrelated topics (weather, sports, recipes, general knowledge)
- Data not in the system (budget, staff, equipment, revenue)
- Personal questions or casual conversation
- Requests for non-analytical tasks

User prompt: "${prompt}"

Return ONLY a JSON object:
{
  "relevant": true/false,
  "reason": "Brief explanation if not relevant"
}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: validationPrompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
  };

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    if (!resp.ok) {
      console.error("Gemini validation error", resp.status);
      return { relevant: true }; // Fail open to allow query generation
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ?? "";
    
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return { relevant: true };
    
    const result = JSON.parse(text.slice(start, end + 1));
    return result;
  } catch (e) {
    console.error("Validation error:", e);
    return { relevant: true }; // Fail open
  }
}

async function askGeminiForPlan(prompt: string): Promise<Plan | null> {
  const system = `
You are a SQL query generator for a PostgreSQL database containing municipal complaints data. Generate SAFE SELECT-only queries using PostgreSQL syntax.

CRITICAL: Use POSTGRESQL syntax, NOT SQLite or MySQL. Key differences:
- Use DATE_TRUNC() instead of strftime()/DATE_FORMAT()
- Use EXTRACT() for date parts
- Use TO_CHAR() for date formatting
- Use COALESCE() instead of IFNULL()
- IMPORTANT: submission_date and status_date are DATE (not timestamp). In Postgres, DATE - DATE returns an integer number of days.

Database Schema:
- complaints: complaint_id, category_id, resident_id, title, description, submission_date (DATE)
- residents: resident_id, first_name, last_name, email, phone, ward (INTEGER)
- service_categories: category_id, category_name
- status_logs: log_id, complaint_id, status, status_date (DATE)

IMPORTANT JOIN RULES:
- Use DISTINCT table aliases (c, r, sc, sl) - never reuse alias names
- For status queries, use the LATEST status per complaint with window functions or DISTINCT ON
- For resolution time, calculate ONLY between c.submission_date and the LATEST sl.status_date where sl.status = 'Resolved'

Return ONLY a JSON object with this structure:
{
  "sql": "SELECT category_name as name, COUNT(*) as value FROM service_categories sc JOIN complaints c ON sc.category_id = c.category_id GROUP BY category_name ORDER BY value DESC",
  "chartType": "bar" | "line" | "pie" | "doughnut",
  "title": "Chart Title",
  "nameColumn": "name",
  "valueColumn": "value"
}

PostgreSQL Date Function Examples:
- Monthly trends: DATE_TRUNC('month', submission_date)
- Year extraction: EXTRACT(YEAR FROM submission_date)
- Month name: TO_CHAR(submission_date, 'Mon')
- Year-month: TO_CHAR(submission_date, 'YYYY-MM')

CRITICAL SQL PATTERNS:
- Status distribution: Use DISTINCT ON (complaint_id) or window functions to get LATEST status per complaint
- Resolution time (in DAYS) with DATE columns: use AVG((sl.status_date - c.submission_date)::numeric) AS value
  - Alternatively, for hours: AVG(EXTRACT(EPOCH FROM (sl.status_date::timestamp - c.submission_date::timestamp)) / 3600.0)
  - Do NOT call EXTRACT on a plain integer (this causes errors)
- Ward queries: Join residents table using resident_id
- Category queries: Join service_categories using category_id

Example for status distribution:
SELECT status as name, COUNT(*) as value 
FROM (
  SELECT DISTINCT ON (complaint_id) complaint_id, status 
  FROM status_logs 
  ORDER BY complaint_id, status_date DESC
) latest_status 
GROUP BY status ORDER BY value DESC

Example for average resolution time by category (DAYS):
SELECT sc.category_name AS name,
       AVG((sl.status_date - c.submission_date)::numeric) AS value
FROM complaints c
JOIN service_categories sc ON c.category_id = sc.category_id
JOIN (
  SELECT DISTINCT ON (complaint_id) complaint_id, status_date
  FROM status_logs
  WHERE status = 'Resolved'
  ORDER BY complaint_id, status_date DESC
) sl ON c.complaint_id = sl.complaint_id
GROUP BY sc.category_name
ORDER BY value DESC

Rules:
- ONLY SELECT statements allowed
- Always alias columns as "name" and "value" for charts
- Use proper JOINs between tables with DISTINCT aliases
- Include appropriate GROUP BY and ORDER BY clauses
- Choose appropriate chart type based on data
- Make the title descriptive
- Use PostgreSQL syntax only (no SQLite/MySQL functions)
- For status queries, ensure you get the LATEST status per complaint to avoid duplicates
- For resolution time, use the DATE-safe patterns shown above
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_API_KEY}`,
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

    // Validate if the prompt is relevant to municipal complaints data
    console.log("Validating prompt relevance:", prompt);
    const validation = await isPromptRelevant(prompt);
    
    if (!validation.relevant) {
      const errorMessage = validation.reason || 
        "This query doesn't relate to municipal complaints data. Please ask about complaints, categories, wards, status, or resolution times.";
      console.log("Prompt rejected:", errorMessage);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ask Gemini to generate a SQL query
    const plan = await askGeminiForPlan(prompt);
    if (!plan) {
      return new Response(JSON.stringify({ error: "Could not generate a valid PostgreSQL query from the prompt. Please try rephrasing your request." }), {
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
      return new Response(JSON.stringify({ error: `SQL execution failed: ${error.message}. The query may contain unsupported syntax.` }), {
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
    return new Response(JSON.stringify({ error: "Unexpected error generating chart. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
