-- Migration to fix address visibility security issue (v8 - restore slug column)
-- 1. Drop the view
DROP VIEW IF EXISTS public.v_explore_activities;

-- 2. Update the function to include slug
CREATE OR REPLACE FUNCTION public.get_explore_activities(p_city_id uuid DEFAULT NULL::uuid)
 RETURNS SETOF record
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_city_id UUID;
    v_user_profile_id UUID;
    v_filter_city_id UUID;
BEGIN
    -- Get authenticated user's city and profile if logged in
    IF auth.uid() IS NOT NULL THEN
        SELECT p.city_id, p.id 
        INTO v_user_city_id, v_user_profile_id
        FROM profiles p
        WHERE p.user_id = auth.uid();
        
        v_filter_city_id := COALESCE(v_user_city_id, p_city_id);
    ELSE
        v_filter_city_id := p_city_id;
    END IF;

    RETURN QUERY
    WITH activity_data AS (
        SELECT 
            act.id,
            act.name,
            act.description,
            act.image_url,
            act.status,
            act.visibility,
            act.registration_rules,
            act.starts_at,
            act.ends_at,
            act.registration_deadline,
            act.address,
            act.hide_address,
            act.type,
            act.city_id AS act_city_id,
            act.capacity,
            act.reserve_capacity,
            act.age_min,
            act.age_max,
            act.created_at,
            act.owner_org_id,
            act.slug -- Added slug
        FROM activity act
        WHERE act.status = 'PUBLISHED'
            AND act.starts_at > NOW()
            AND act.registration_rules != 'SELECTED_MEMBERS'
            AND (
                act.visibility = 'PUBLIC'
                OR (
                    v_user_profile_id IS NOT NULL 
                    AND act.visibility = 'PRIVATE'
                    AND is_eligible_member(act.id, v_user_profile_id)
                )
                OR (
                    v_user_profile_id IS NOT NULL
                    AND is_activity_org_staff(act.id, v_user_profile_id)
                )
            )
            AND (v_filter_city_id IS NULL OR act.city_id = v_filter_city_id)
    )
    SELECT 
        ad.id,
        ad.name,
        ad.description,
        ad.image_url,
        ad.status,
        ad.visibility,
        ad.registration_rules,
        ad.starts_at,
        ad.ends_at,
        ad.starts_at::DATE,
        to_char(ad.starts_at, 'HH24:MI'),
        to_char(ad.ends_at, 'HH24:MI'),
        EXTRACT(WEEK FROM ad.starts_at)::INTEGER,
        (EXTRACT(WEEK FROM ad.starts_at) = EXTRACT(WEEK FROM NOW()))::BOOLEAN,
        ad.registration_deadline,
        (ad.registration_deadline < NOW())::BOOLEAN,
        CASE WHEN ad.hide_address IS TRUE THEN NULL ELSE ad.address END, 
        CASE 
            WHEN ad.type = 'NORMAL' THEN 'Normal'
            WHEN ad.type = 'RANDOM' THEN 'Slumpad'
            ELSE ad.type
        END,
        ad.act_city_id,
        c.city, 
        o.id,
        o.org_namn, 
        o.logo_url,
        ad.capacity,
        ad.reserve_capacity,
        (SELECT COUNT(*) FROM registration r WHERE r.activity_id = ad.id AND r.status = 'ACCEPTED'),
        CASE
            WHEN (SELECT COUNT(*) FROM registration r WHERE r.activity_id = ad.id AND r.status = 'ACCEPTED') >= ad.capacity THEN 'Fullbokad'
            ELSE (ad.capacity - (SELECT COUNT(*) FROM registration r WHERE r.activity_id = ad.id AND r.status = 'ACCEPTED'))::text || ' platser kvar'
        END,
        (ad.capacity - (SELECT COUNT(*) FROM registration r WHERE r.activity_id = ad.id AND r.status = 'ACCEPTED'))::INTEGER,
        (SELECT COUNT(*) FROM registration r WHERE r.activity_id = ad.id) > 10,
        (SELECT jsonb_agg(jsonb_build_object('id', cat.id, 'name', cat.cat_name, 'color', cat.color, 'bg_color', cat.bg_color)) 
         FROM activity_categories ac
         JOIN categories cat ON ac.category_id = cat.id
         WHERE ac.activity_id = ad.id),
        (SELECT array_agg(category_id) FROM activity_categories WHERE activity_id = ad.id),
        (SELECT jsonb_agg(jsonb_build_object('id', ts.id, 'name', ts.name))
         FROM activity_target_subgroups ats
         JOIN target_subgroups ts ON ats.sub_group_id = ts.id
         WHERE ats.activity_id = ad.id),
        ad.age_min,
        ad.age_max,
        CASE
            WHEN ad.age_min IS NULL AND ad.age_max IS NULL THEN 'Alla åldrar'
            WHEN ad.age_min IS NOT NULL AND ad.age_max IS NOT NULL THEN ad.age_min || '-' || ad.age_max || ' år'
            WHEN ad.age_min IS NOT NULL THEN 'Från ' || ad.age_min || ' år'
            WHEN ad.age_max IS NOT NULL THEN 'Upp till ' || ad.age_max || ' år'
            ELSE 'Alla åldrar'
        END,
        user_reg.id,
        user_reg.status,
        (user_reg.id IS NOT NULL)::BOOLEAN,
        CASE
            WHEN v_user_profile_id IS NULL THEN false
            WHEN ad.registration_deadline < NOW() THEN false
            WHEN is_activity_org_staff(ad.id, auth.uid()) THEN false
            WHEN ad.registration_rules = 'ONLY_MEMBERS' AND NOT EXISTS (
                SELECT 1 FROM memberships m 
                WHERE m.profile_id = v_user_profile_id
                AND (m.org_id = ad.owner_org_id OR m.org_id IN (SELECT org_id FROM activity_organisation WHERE activity_id = ad.id))
                AND m.membership_state = 'active'
            ) THEN false
            WHEN has_registration_time_conflict(ad.id, v_user_profile_id) THEN false
            ELSE true
        END::BOOLEAN,
        CASE
            WHEN v_user_profile_id IS NULL THEN false
            ELSE EXISTS (
                SELECT 1 FROM memberships m 
                WHERE m.profile_id = v_user_profile_id
                AND (m.org_id = ad.owner_org_id OR m.org_id IN (SELECT org_id FROM activity_organisation WHERE activity_id = ad.id))
                AND m.membership_state = 'active'
            )
        END::BOOLEAN,
        (ad.registration_rules IN ('ONLY_MEMBERS', 'SELECTED_MEMBERS'))::BOOLEAN,
        (ad.registration_rules = 'OPEN_FOR_ALL')::BOOLEAN,
        ad.created_at::TIMESTAMPTZ,
        CASE
            WHEN v_user_profile_id IS NULL THEN false
            ELSE EXISTS (
                SELECT 1 FROM activity_favorites af
                WHERE af.profile_id = v_user_profile_id
                AND af.activity_id = ad.id
            )
        END::BOOLEAN,
        ad.hide_address,
        ad.slug -- Added slug
    FROM activity_data ad
    JOIN organizations o ON ad.owner_org_id = o.id
    LEFT JOIN cities c ON ad.act_city_id = c.id
    LEFT JOIN registration user_reg ON user_reg.activity_id = ad.id 
        AND user_reg.profile_id = v_user_profile_id
    ORDER BY ad.starts_at ASC;
END;
$function$;

-- 3. Recreate the view
CREATE OR REPLACE VIEW public.v_explore_activities AS
 SELECT 
    activity_id,
    activity_name,
    description,
    image_url,
    activity_status,
    visibility,
    registration_rules,
    starts_at,
    ends_at,
    activity_date,
    start_time,
    end_time,
    week_number,
    is_this_week,
    registration_deadline,
    deadline_passed,
    address,
    activity_type_label,
    city_id,
    city,
    organization_id,
    organization_name,
    organization_logo,
    capacity,
    reserve_capacity,
    accepted_count,
    capacity_status,
    available_spots,
    is_popular,
    categories,
    category_ids,
    target_subgroups,
    age_min,
    age_max,
    age_range_text,
    user_registration_id,
    user_registration_status,
    is_user_registered,
    can_user_register,
    is_user_member,
    requires_membership,
    is_open_for_all,
    created_at,
    is_favorited,
    hide_address,
    slug -- Added slug
   FROM get_explore_activities(NULL::uuid) get_explore_activities(
    activity_id uuid, 
    activity_name text, 
    description text, 
    image_url text, 
    activity_status activity_status, 
    visibility visibility, 
    registration_rules registration_rules, 
    starts_at timestamp with time zone, 
    ends_at timestamp with time zone, 
    activity_date date, 
    start_time text, 
    end_time text, 
    week_number integer, 
    is_this_week boolean, 
    registration_deadline timestamp with time zone, 
    deadline_passed boolean, 
    address text, 
    activity_type_label text, 
    city_id uuid, 
    city text, 
    organization_id uuid, 
    organization_name text, 
    organization_logo text, 
    capacity integer, 
    reserve_capacity integer, 
    accepted_count bigint, 
    capacity_status text, 
    available_spots integer, 
    is_popular boolean, 
    categories jsonb, 
    category_ids uuid[], 
    target_subgroups jsonb, 
    age_min integer, 
    age_max integer, 
    age_range_text text, 
    user_registration_id uuid, 
    user_registration_status registration_status, 
    is_user_registered boolean, 
    can_user_register boolean, 
    is_user_member boolean, 
    requires_membership boolean, 
    is_open_for_all boolean, 
    created_at timestamp with time zone, 
    is_favorited boolean,
    hide_address boolean,
    slug text -- Added slug
   );
