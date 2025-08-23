
-- Create profiles table for user roles and information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'public' CHECK (role IN ('public', 'resident', 'staff', 'admin')),
  ward INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'public'
  );
$$;

-- Create trigger function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'public'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow read access" ON public.complaints;
DROP POLICY IF EXISTS "Allow read access to complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow read access" ON public.residents;
DROP POLICY IF EXISTS "Allow read access to residents" ON public.residents;
DROP POLICY IF EXISTS "Allow read access" ON public.service_categories;
DROP POLICY IF EXISTS "Allow read access to service_categories" ON public.service_categories;
DROP POLICY IF EXISTS "Allow read access" ON public.status_logs;
DROP POLICY IF EXISTS "Allow read access to status_logs" ON public.status_logs;

-- Create secure RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Staff and admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_current_user_role() IN ('staff', 'admin'));

-- Create secure RLS policies for service_categories (public data)
CREATE POLICY "Anyone can view service categories" ON public.service_categories
  FOR SELECT USING (true);

-- Create secure RLS policies for residents (sensitive PII data)
CREATE POLICY "Staff and admins can view residents" ON public.residents
  FOR SELECT USING (public.get_current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Residents can view own data" ON public.residents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'resident' 
      AND p.ward = residents.ward
    )
  );

-- Create secure RLS policies for complaints
CREATE POLICY "Staff and admins can view all complaints" ON public.complaints
  FOR SELECT USING (public.get_current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Residents can view complaints in their ward" ON public.complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.residents r ON r.ward = p.ward
      WHERE p.id = auth.uid() 
      AND p.role = 'resident'
      AND r.resident_id = complaints.resident_id
    )
  );

CREATE POLICY "Residents can create complaints" ON public.complaints
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.residents r ON r.ward = p.ward
      WHERE p.id = auth.uid() 
      AND p.role = 'resident'
      AND r.resident_id = complaints.resident_id
    )
  );

-- Create secure RLS policies for status_logs
CREATE POLICY "Staff and admins can view all status logs" ON public.status_logs
  FOR SELECT USING (public.get_current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff can update status logs" ON public.status_logs
  FOR ALL USING (public.get_current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Residents can view status of their complaints" ON public.status_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      JOIN public.residents r ON r.resident_id = c.resident_id
      JOIN public.profiles p ON p.ward = r.ward
      WHERE p.id = auth.uid() 
      AND p.role = 'resident'
      AND c.complaint_id = status_logs.complaint_id
    )
  );

-- Update database functions to use proper search_path
CREATE OR REPLACE FUNCTION public.execute_raw_sql(sql_query text)
RETURNS TABLE(result jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    query_result RECORD;
    user_role TEXT;
BEGIN
    -- Get current user role
    SELECT public.get_current_user_role() INTO user_role;
    
    -- Only allow staff and admin users to execute queries
    IF user_role NOT IN ('staff', 'admin') THEN
        RAISE EXCEPTION 'Access denied. Only staff and admin users can execute queries.';
    END IF;
    
    -- Only allow SELECT statements for security
    IF LOWER(TRIM(sql_query)) NOT LIKE 'select%' THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed';
    END IF;
    
    -- Execute the query and return results as JSONB
    FOR query_result IN EXECUTE sql_query LOOP
        result := to_jsonb(query_result);
        RETURN NEXT;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
    rec record;
    results json[] := '{}';
    user_role TEXT;
BEGIN
    -- Get current user role
    SELECT public.get_current_user_role() INTO user_role;
    
    -- Only allow staff and admin users to execute queries
    IF user_role NOT IN ('staff', 'admin') THEN
        RAISE EXCEPTION 'Access denied. Only staff and admin users can execute queries.';
    END IF;
    
    -- Security check: only allow SELECT statements
    IF upper(trim(query)) NOT LIKE 'SELECT%' THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- Additional security: block dangerous keywords
    IF upper(query) ~ '(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|EXEC)' THEN
        RAISE EXCEPTION 'Query contains forbidden keywords';
    END IF;
    
    -- Execute the dynamic query
    FOR rec IN EXECUTE query
    LOOP
        results := array_append(results, to_json(rec));
    END LOOP;
    
    -- Return as JSON array
    RETURN array_to_json(results);
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Update other database functions with proper search_path
CREATE OR REPLACE FUNCTION public.complaints_monthly(start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date)
RETURNS TABLE(name text, value bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_char(date_trunc('month', c.submission_date), 'Mon') AS name,
         COUNT(*)::bigint AS value
  FROM public.complaints c
  WHERE (start_date IS NULL OR c.submission_date >= start_date)
    AND (end_date IS NULL OR c.submission_date <= end_date)
  GROUP BY date_trunc('month', c.submission_date)
  ORDER BY date_trunc('month', c.submission_date);
$$;

CREATE OR REPLACE FUNCTION public.complaints_by_category(start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date)
RETURNS TABLE(name text, value bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sc.category_name AS name,
         COUNT(*)::bigint AS value
  FROM public.complaints c
  JOIN public.service_categories sc
    ON sc.category_id = c.category_id
  WHERE (start_date IS NULL OR c.submission_date >= start_date)
    AND (end_date IS NULL OR c.submission_date <= end_date)
  GROUP BY sc.category_name
  ORDER BY value DESC;
$$;

CREATE OR REPLACE FUNCTION public.complaints_by_ward(start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date)
RETURNS TABLE(name text, value bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ('Ward ' || r.ward::text) AS name,
         COUNT(*)::bigint AS value
  FROM public.complaints c
  JOIN public.residents r
    ON r.resident_id = c.resident_id
  WHERE (start_date IS NULL OR c.submission_date >= start_date)
    AND (end_date IS NULL OR c.submission_date <= end_date)
  GROUP BY r.ward
  ORDER BY r.ward;
$$;

CREATE OR REPLACE FUNCTION public.complaints_status(start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date)
RETURNS TABLE(name text, value bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.status AS name,
         COUNT(*)::bigint AS value
  FROM public.status_logs s
  WHERE (start_date IS NULL OR s.status_date >= start_date)
    AND (end_date IS NULL OR s.status_date <= end_date)
  GROUP BY s.status
  ORDER BY value DESC;
$$;
