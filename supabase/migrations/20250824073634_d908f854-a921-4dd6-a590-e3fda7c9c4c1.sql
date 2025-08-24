
-- Revert added restrictive policies (safe to drop if they don't exist)
DROP POLICY IF EXISTS "Residents can view own data" ON public.residents;

DROP POLICY IF EXISTS "Staff and admins can view all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Residents can view complaints in their ward" ON public.complaints;
DROP POLICY IF EXISTS "Residents can create complaints" ON public.complaints;

DROP POLICY IF EXISTS "Residents can view status of their complaints" ON public.status_logs;

-- Keep existing original policies (like "Anyone can view service categories",
-- "Staff and admins can view residents", "Staff and admins can view all status logs",
-- "Staff can update status logs") untouched.

-- Restore execute_raw_sql to allow public read (no role checks), but SELECT-only and with a keyword blocklist
CREATE OR REPLACE FUNCTION public.execute_raw_sql(sql_query text)
RETURNS TABLE(result jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_rec RECORD;
  lower_sql text := lower(sql_query);
BEGIN
  -- Allow only SELECT statements
  IF lower(btrim(sql_query)) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'Only SELECT statements are allowed';
  END IF;

  -- Block dangerous keywords
  IF lower_sql ~ '(drop|delete|update|insert|alter|create|truncate|grant|revoke|execute|call|;)' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  FOR row_rec IN EXECUTE sql_query LOOP
    result := to_jsonb(row_rec);
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Restore execute_sql similarly (not used by the app, but keep consistent)
CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lower_q text := lower(query);
  json_result json;
BEGIN
  IF lower(btrim(query)) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  IF lower_q ~ '(drop|delete|update|insert|alter|create|truncate|grant|revoke|execute|call|;)' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  EXECUTE format('select coalesce(json_agg(t), ''[]''::json) from (%s) t', query) INTO json_result;
  RETURN json_result;
END;
$$;
