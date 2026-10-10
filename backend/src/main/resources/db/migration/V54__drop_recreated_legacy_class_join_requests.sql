-- Remove the obsolete table if it was recreated after V22.
-- Active join requests use requests and class_join_request_details.
DROP TABLE IF EXISTS public.class_join_requests;
