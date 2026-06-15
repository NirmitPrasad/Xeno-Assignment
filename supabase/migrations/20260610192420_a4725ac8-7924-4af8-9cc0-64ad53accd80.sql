
CREATE OR REPLACE FUNCTION public.exec_sql_select(q text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF q !~* '^\s*select\s' THEN
    RAISE EXCEPTION 'Only SELECT queries allowed';
  END IF;
  IF q ~* '(;|--|insert|update|delete|drop|alter|truncate|grant|create|copy)' THEN
    RAISE EXCEPTION 'Unsafe SQL detected';
  END IF;
  RETURN QUERY EXECUTE 'SELECT row_to_json(t) FROM (' || q || ') t';
END;
$$;

REVOKE ALL ON FUNCTION public.exec_sql_select(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql_select(text) TO service_role;
