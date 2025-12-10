CREATE OR REPLACE VIEW v_member_activities AS
SELECT 
    a.id AS activity_id,
    a.name AS aktivitet,
    a.status AS activity_status,
    a.visibility,
    a.activity_type,
    a.registration_rules AS registreringsregler,
    a.description AS beskrivning,
    a.image_url,
    a.starts_at AS start_datum_tid,
    a.ends_at AS slut_datum_tid,
    a.starts_at::date AS datum,
    to_char(a.starts_at, 'HH24:MI'::text) AS start_tid,
    to_char(a.ends_at, 'HH24:MI'::text) AS slut_tid,
    a.registration_deadline AS anmalningsfrist,
    CASE
        WHEN a.registration_deadline IS NULL THEN true
        WHEN now() <= a.registration_deadline THEN true
        ELSE false
    END AS anmalning_oppen,
    CASE
        WHEN a.hide_address = true THEN NULL
        ELSE a.address
    END AS plats,
    a.hide_address,
    a.type AS aktivitetstyp,
    a.capacity AS total_kapacitet,
    a.reserve_capacity AS reservplatser,
    COALESCE(( SELECT count(*) AS count
           FROM registration r
          WHERE r.activity_id = a.id AND r.status = 'ACCEPTED'::registration_status), 0::bigint) AS antal_godkanda,
    COALESCE(( SELECT count(*) AS count
           FROM registration r
          WHERE r.activity_id = a.id AND r.status = 'PENDING'::registration_status), 0::bigint) AS antal_vantande,
    COALESCE(( SELECT count(*) AS count
           FROM registration r
          WHERE r.activity_id = a.id AND r.status = 'WAITLISTED'::registration_status), 0::bigint) AS antal_vantelista,
    COALESCE(( SELECT count(*) AS count
           FROM registration r
          WHERE r.activity_id = a.id AND r.status = 'INVITED'::registration_status), 0::bigint) AS antal_inbjudna,
    CASE
        WHEN a.capacity IS NULL THEN 'Obegränsat'::text
        WHEN COALESCE(( SELECT count(*) AS count
           FROM registration r
          WHERE r.activity_id = a.id AND r.status = 'ACCEPTED'::registration_status), 0::bigint) >= a.capacity THEN 'Fullbokad'::text
        ELSE (a.capacity - COALESCE(( SELECT count(*) AS count
           FROM registration r
          WHERE r.activity_id = a.id AND r.status = 'ACCEPTED'::registration_status), 0::bigint))::text
    END AS kapacitetsstatus,
    CASE
        WHEN a.capacity IS NULL THEN 999999::bigint
        ELSE a.capacity - COALESCE(( SELECT count(*) AS count
           FROM registration r
          WHERE r.activity_id = a.id AND r.status = 'ACCEPTED'::registration_status), 0::bigint)
    END AS lediga_platser,
    o.org_namn AS agande_organisation,
    o.id AS organization_id,
    o.city_id,
    COALESCE(( SELECT jsonb_agg(jsonb_build_object('profile_id', p_contact.id, 'alias', p_contact.alias, 'public_name', p_contact.public_name, 'is_primary', acp.is_primary, 'email', up.email, 'phone_number', up.phone_number) ORDER BY acp.sort_order, acp.is_primary DESC) AS jsonb_agg
           FROM activity_contact_persons acp
             JOIN profiles p_contact ON p_contact.id = acp.profile_id
             LEFT JOIN users_private up ON up.profile_id = p_contact.id
          WHERE acp.activity_id = a.id), '[]'::jsonb) AS kontaktpersoner_json,
    p.alias AS skapad_av,
    p.id AS skapad_av_profile_id,
    a.created_at AS skapad_datum,
    a.updated_at AS uppdaterad_datum,
    EXTRACT(epoch FROM a.starts_at - now()) AS sekunder_till_start,
    CASE
        WHEN a.starts_at <= now() THEN 'Startad'::text
        WHEN EXTRACT(epoch FROM a.starts_at - now()) < 60::numeric THEN floor(EXTRACT(epoch FROM a.starts_at - now()))::text || ' sekunder till start'::text
        WHEN EXTRACT(epoch FROM a.starts_at - now()) < 3600::numeric THEN floor(EXTRACT(epoch FROM a.starts_at - now()) / 60::numeric)::text || ' minuter till start'::text
        WHEN EXTRACT(epoch FROM a.starts_at - now()) < 86400::numeric THEN floor(EXTRACT(epoch FROM a.starts_at - now()) / 3600::numeric)::text || ' timmar till start'::text
        ELSE floor(EXTRACT(epoch FROM a.starts_at - now()) / 86400::numeric)::text || ' dagar till start'::text
    END AS time_to_start,
    CASE
        WHEN now() >= a.starts_at AND now() <= a.ends_at THEN 'Pågår'::text
        WHEN now() > a.ends_at THEN 'Avslutad'::text
        ELSE 'Kommande'::text
    END AS tidsstatus,
    a.slug
   FROM activity a
     LEFT JOIN organizations o ON o.id = a.owner_org_id
     LEFT JOIN profiles p ON p.id = a.created_by;
