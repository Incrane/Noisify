-- =====================================================
-- Förmåner (Perks) System Migration
-- Created: 2025-12-08
-- Description: Creates perk types, multi-org sharing, course perks,
--              and refactors user_perks/room_perks relationships
-- =====================================================

-- ===========================================
-- 1. CREATE perk_types TABLE
-- ===========================================
-- Global perk definitions that can be reused and shared across organizations

CREATE TABLE IF NOT EXISTS perk_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category perk_category NOT NULL DEFAULT 'OTHER',
  icon TEXT, -- icon identifier (e.g., "music", "gamepad", "star")
  created_by_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint on name per organization
CREATE UNIQUE INDEX IF NOT EXISTS perk_types_name_org_idx 
  ON perk_types(name, created_by_org_id) 
  WHERE created_by_org_id IS NOT NULL;

-- Enable RLS
ALTER TABLE perk_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for perk_types
-- Staff can see perk types from their organization + shared ones
CREATE POLICY "Staff can view own org perk types"
  ON perk_types FOR SELECT
  TO authenticated
  USING (
    created_by_org_id IN (
      SELECT org_id FROM org_user WHERE profile_id = auth.uid()
    )
    OR
    id IN (
      SELECT perk_type_id FROM perk_type_organizations 
      WHERE org_id IN (SELECT org_id FROM org_user WHERE profile_id = auth.uid())
      AND status = 'active'
    )
  );

-- Staff can create perk types for their organization
CREATE POLICY "Staff can create perk types"
  ON perk_types FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_org_id IN (
      SELECT org_id FROM org_user WHERE profile_id = auth.uid() AND role_id >= 2
    )
  );

-- Staff can update their own org's perk types
CREATE POLICY "Staff can update own perk types"
  ON perk_types FOR UPDATE
  TO authenticated
  USING (
    created_by_org_id IN (
      SELECT org_id FROM org_user WHERE profile_id = auth.uid() AND role_id >= 2
    )
  );

-- Staff can delete their own org's perk types
CREATE POLICY "Staff can delete own perk types"
  ON perk_types FOR DELETE
  TO authenticated
  USING (
    created_by_org_id IN (
      SELECT org_id FROM org_user WHERE profile_id = auth.uid() AND role_id >= 3
    )
  );

-- ===========================================
-- 2. CREATE perk_type_organizations TABLE
-- ===========================================
-- Junction table for invite-only sharing of perk types across organizations

CREATE TABLE IF NOT EXISTS perk_type_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perk_type_id UUID NOT NULL REFERENCES perk_types(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(perk_type_id, org_id)
);

-- Enable RLS
ALTER TABLE perk_type_organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for perk_type_organizations
-- Staff can see invites for their organization
CREATE POLICY "Staff can view org perk shares"
  ON perk_type_organizations FOR SELECT
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_user WHERE profile_id = auth.uid())
    OR
    invited_by_org_id IN (SELECT org_id FROM org_user WHERE profile_id = auth.uid())
  );

-- Staff can invite other orgs to use their perk types
CREATE POLICY "Staff can create perk shares"
  ON perk_type_organizations FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by_org_id IN (
      SELECT org_id FROM org_user WHERE profile_id = auth.uid() AND role_id >= 3
    )
    AND
    perk_type_id IN (
      SELECT id FROM perk_types WHERE created_by_org_id = invited_by_org_id
    )
  );

-- Staff can respond to invites (update status)
CREATE POLICY "Staff can update perk share status"
  ON perk_type_organizations FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM org_user WHERE profile_id = auth.uid() AND role_id >= 3
    )
  );

-- ===========================================
-- 3. CREATE course_perks TABLE
-- ===========================================
-- Perks that are automatically granted when a course is completed

CREATE TABLE IF NOT EXISTS course_perks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  perk_type_id UUID NOT NULL REFERENCES perk_types(id) ON DELETE CASCADE,
  grant_condition perk_grant_condition DEFAULT 'ON_COMPLETION',
  expires_after_days INTEGER, -- NULL = no expiration
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, perk_type_id)
);

-- Enable RLS
ALTER TABLE course_perks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_perks
CREATE POLICY "Staff can view course perks"
  ON course_perks FOR SELECT
  TO authenticated
  USING (
    course_id IN (
      SELECT id FROM courses WHERE owner_org_id IN (
        SELECT org_id FROM org_user WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can manage course perks"
  ON course_perks FOR ALL
  TO authenticated
  USING (
    course_id IN (
      SELECT id FROM courses WHERE owner_org_id IN (
        SELECT org_id FROM org_user WHERE profile_id = auth.uid() AND role_id >= 2
      )
    )
  );

-- ===========================================
-- 4. MODIFY user_perks TABLE
-- ===========================================
-- Add perk_type_id reference and source tracking

-- Add new columns (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_perks' AND column_name = 'perk_type_id'
  ) THEN
    ALTER TABLE user_perks ADD COLUMN perk_type_id UUID REFERENCES perk_types(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_perks' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE user_perks ADD COLUMN source_type TEXT DEFAULT 'manual' 
      CHECK (source_type IN ('manual', 'course', 'membership', 'event'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_perks' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE user_perks ADD COLUMN source_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_perks' AND column_name = 'granted_by'
  ) THEN
    ALTER TABLE user_perks ADD COLUMN granted_by UUID REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_perks' AND column_name = 'revoked_at'
  ) THEN
    ALTER TABLE user_perks ADD COLUMN revoked_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_perks' AND column_name = 'revoked_by'
  ) THEN
    ALTER TABLE user_perks ADD COLUMN revoked_by UUID REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_perks' AND column_name = 'revoke_reason'
  ) THEN
    ALTER TABLE user_perks ADD COLUMN revoke_reason TEXT;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_perks_perk_type_id_idx ON user_perks(perk_type_id);
CREATE INDEX IF NOT EXISTS user_perks_profile_status_idx ON user_perks(profile_id, status);

-- ===========================================
-- 5. MODIFY room_perks TABLE
-- ===========================================
-- Add perk_type_id reference (transition from user_perks reference)

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_perks' AND column_name = 'perk_type_id'
  ) THEN
    ALTER TABLE room_perks ADD COLUMN perk_type_id UUID REFERENCES perk_types(id);
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS room_perks_perk_type_id_idx ON room_perks(perk_type_id);

-- ===========================================
-- 6. RPC FUNCTIONS
-- ===========================================

-- Function to get all perk types available to an organization (owned + shared)
CREATE OR REPLACE FUNCTION get_org_perk_types(p_org_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category perk_category,
  icon TEXT,
  is_active BOOLEAN,
  created_by_org_id UUID,
  is_owned BOOLEAN,
  is_shared BOOLEAN,
  shared_by_org_name TEXT,
  user_count BIGINT,
  room_count BIGINT,
  course_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id,
    pt.name,
    pt.description,
    pt.category,
    pt.icon,
    pt.is_active,
    pt.created_by_org_id,
    (pt.created_by_org_id = p_org_id) AS is_owned,
    (pt.created_by_org_id != p_org_id) AS is_shared,
    CASE 
      WHEN pt.created_by_org_id != p_org_id THEN (SELECT o.name FROM organizations o WHERE o.id = pt.created_by_org_id)
      ELSE NULL
    END AS shared_by_org_name,
    (SELECT COUNT(*) FROM user_perks up WHERE up.perk_type_id = pt.id AND up.status = 'ACTIVE') AS user_count,
    (SELECT COUNT(*) FROM room_perks rp WHERE rp.perk_type_id = pt.id) AS room_count,
    (SELECT COUNT(*) FROM course_perks cp WHERE cp.perk_type_id = pt.id) AS course_count
  FROM perk_types pt
  WHERE pt.is_active = true
    AND (
      pt.created_by_org_id = p_org_id
      OR pt.id IN (
        SELECT pto.perk_type_id FROM perk_type_organizations pto 
        WHERE pto.org_id = p_org_id AND pto.status = 'active'
      )
    )
  ORDER BY pt.name;
END;
$$;

-- Function to check if a user has a specific perk type
CREATE OR REPLACE FUNCTION user_has_perk_type(p_profile_id UUID, p_perk_type_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_perks
    WHERE profile_id = p_profile_id
      AND perk_type_id = p_perk_type_id
      AND status = 'ACTIVE'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- Function to grant a perk to a user
CREATE OR REPLACE FUNCTION grant_perk_to_user(
  p_profile_id UUID,
  p_perk_type_id UUID,
  p_org_id UUID,
  p_source_type TEXT DEFAULT 'manual',
  p_source_id UUID DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_perk_id UUID;
  v_perk_type RECORD;
BEGIN
  -- Get perk type details
  SELECT * INTO v_perk_type FROM perk_types WHERE id = p_perk_type_id;
  
  IF v_perk_type IS NULL THEN
    RAISE EXCEPTION 'Perk type not found';
  END IF;

  -- Check if user already has this perk (active)
  SELECT id INTO v_user_perk_id
  FROM user_perks
  WHERE profile_id = p_profile_id
    AND perk_type_id = p_perk_type_id
    AND status = 'ACTIVE';
  
  IF v_user_perk_id IS NOT NULL THEN
    -- Update expiration if provided
    IF p_expires_at IS NOT NULL THEN
      UPDATE user_perks SET expires_at = p_expires_at WHERE id = v_user_perk_id;
    END IF;
    RETURN v_user_perk_id;
  END IF;

  -- Create new user perk
  INSERT INTO user_perks (
    profile_id,
    perk_type_id,
    org_id,
    name,
    description,
    category,
    grant_condition,
    source_type,
    source_id,
    expires_at,
    status,
    granted_by
  )
  VALUES (
    p_profile_id,
    p_perk_type_id,
    p_org_id,
    v_perk_type.name,
    v_perk_type.description,
    v_perk_type.category,
    'ON_APPROVAL',
    p_source_type,
    p_source_id,
    p_expires_at,
    'ACTIVE',
    auth.uid()
  )
  RETURNING id INTO v_user_perk_id;

  RETURN v_user_perk_id;
END;
$$;

-- Function to revoke a user's perk
CREATE OR REPLACE FUNCTION revoke_user_perk(
  p_user_perk_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_perks
  SET 
    status = 'REVOKED',
    revoked_at = NOW(),
    revoked_by = auth.uid(),
    revoke_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_user_perk_id;
  
  RETURN FOUND;
END;
$$;

-- Function to get all perks for a user
CREATE OR REPLACE FUNCTION get_user_perks(p_profile_id UUID)
RETURNS TABLE (
  id UUID,
  perk_type_id UUID,
  perk_name TEXT,
  perk_description TEXT,
  perk_category perk_category,
  perk_icon TEXT,
  org_id UUID,
  org_name TEXT,
  status perk_status,
  source_type TEXT,
  granted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  granted_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.perk_type_id,
    COALESCE(pt.name, up.name) AS perk_name,
    COALESCE(pt.description, up.description) AS perk_description,
    COALESCE(pt.category, up.category) AS perk_category,
    pt.icon AS perk_icon,
    up.org_id,
    o.name AS org_name,
    up.status,
    up.source_type,
    up.granted_at,
    up.expires_at,
    p.alias AS granted_by_name
  FROM user_perks up
  LEFT JOIN perk_types pt ON pt.id = up.perk_type_id
  LEFT JOIN organizations o ON o.id = up.org_id
  LEFT JOIN profiles p ON p.id = up.granted_by
  WHERE up.profile_id = p_profile_id
  ORDER BY 
    CASE up.status WHEN 'ACTIVE' THEN 0 WHEN 'EXPIRED' THEN 1 ELSE 2 END,
    up.granted_at DESC;
END;
$$;

-- Function to check if user can book a room (updated to use perk_type_id)
CREATE OR REPLACE FUNCTION can_user_book_room_with_perks(
  p_room_id UUID,
  p_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room RECORD;
BEGIN
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  
  IF v_room IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check booking rule
  CASE v_room.booking_rule
    WHEN 'OPEN_FOR_ALL' THEN
      RETURN TRUE;
    WHEN 'STAFF_ONLY' THEN
      RETURN EXISTS (
        SELECT 1 FROM org_user 
        WHERE profile_id = p_profile_id AND org_id = v_room.org_id AND role_id >= 2
      );
    WHEN 'MEMBERS_ONLY' THEN
      RETURN EXISTS (
        SELECT 1 FROM memberships 
        WHERE profile_id = p_profile_id 
          AND org_id = v_room.org_id 
          AND membership_state = 'active'
      );
    WHEN 'REQUIRES_PERK' THEN
      -- Check if user has ANY of the required perks
      RETURN EXISTS (
        SELECT 1 
        FROM room_perks rp
        JOIN user_perks up ON up.perk_type_id = rp.perk_type_id
        WHERE rp.room_id = p_room_id
          AND up.profile_id = p_profile_id
          AND up.status = 'ACTIVE'
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
      );
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- ===========================================
-- 7. TRIGGER FOR COURSE COMPLETION
-- ===========================================
-- Automatically grant perks when a course is completed

CREATE OR REPLACE FUNCTION on_course_enrollment_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_perk RECORD;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Only trigger when status changes to COMPLETED
  IF NEW.enrollment_status = 'COMPLETED' AND (OLD.enrollment_status IS NULL OR OLD.enrollment_status != 'COMPLETED') THEN
    -- Get all perks configured for this course
    FOR v_course_perk IN 
      SELECT cp.*, pt.name AS perk_name, c.owner_org_id
      FROM course_perks cp
      JOIN perk_types pt ON pt.id = cp.perk_type_id
      JOIN courses c ON c.id = cp.course_id
      WHERE cp.course_id = NEW.course_id
        AND cp.grant_condition = 'ON_COMPLETION'
    LOOP
      -- Calculate expiration if configured
      v_expires_at := NULL;
      IF v_course_perk.expires_after_days IS NOT NULL THEN
        v_expires_at := NOW() + (v_course_perk.expires_after_days || ' days')::INTERVAL;
      END IF;
      
      -- Grant the perk
      PERFORM grant_perk_to_user(
        NEW.profile_id,
        v_course_perk.perk_type_id,
        v_course_perk.owner_org_id,
        'course',
        NEW.course_id,
        v_expires_at
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS trg_course_enrollment_perk_grant ON course_enrollments;
CREATE TRIGGER trg_course_enrollment_perk_grant
  AFTER UPDATE ON course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION on_course_enrollment_update();

-- ===========================================
-- 8. GRANT PERMISSIONS
-- ===========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON perk_types TO authenticated;
GRANT SELECT, INSERT, UPDATE ON perk_type_organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON course_perks TO authenticated;
GRANT EXECUTE ON FUNCTION get_org_perk_types TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_perk_type TO authenticated;
GRANT EXECUTE ON FUNCTION grant_perk_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_user_perk TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_perks TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_book_room_with_perks TO authenticated;
