-- =====================================================
-- PLANIFY FOUNDATION - Phase 1
-- Plans, Permission Sets, Plan Members, Categories
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE planify_member_status AS ENUM ('pending', 'active', 'revoked');
CREATE TYPE planify_membership_type AS ENUM ('internal', 'external');

-- =====================================================
-- PERMISSION SETS TABLE
-- =====================================================

CREATE TABLE planify_permission_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope: NULL = system default, org_id = org-wide, plan_id = plan-specific
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID, -- References planify_plans, added after plans table created

  -- Metadata
  name TEXT NOT NULL,
  name_sv TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  is_guest BOOLEAN DEFAULT FALSE,

  -- Permissions array
  permissions TEXT[] NOT NULL DEFAULT '{}',

  -- Restrictions for sensitive data hiding
  restrictions JSONB DEFAULT '{}',

  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PLANS TABLE
-- =====================================================

CREATE TABLE planify_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  is_shared BOOLEAN DEFAULT FALSE,
  default_sync_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for permission_sets.plan_id now that plans table exists
ALTER TABLE planify_permission_sets
ADD CONSTRAINT fk_permission_sets_plan
FOREIGN KEY (plan_id) REFERENCES planify_plans(id) ON DELETE CASCADE;

-- =====================================================
-- PLAN MEMBERS TABLE
-- =====================================================

CREATE TABLE planify_plan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES planify_plans(id) ON DELETE CASCADE,

  -- User identification
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,

  -- Permission set reference
  permission_set_id UUID NOT NULL REFERENCES planify_permission_sets(id),

  -- Membership type
  membership_type planify_membership_type NOT NULL DEFAULT 'internal',

  -- Special flags
  is_owner BOOLEAN DEFAULT FALSE,

  -- Invitation tracking
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status planify_member_status DEFAULT 'pending',

  -- Constraints
  UNIQUE(plan_id, profile_id),
  UNIQUE(plan_id, email)
);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================

CREATE TABLE planify_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_planify_plans_org ON planify_plans(org_id);
CREATE INDEX idx_planify_plans_created_by ON planify_plans(created_by);
CREATE INDEX idx_planify_permission_sets_org ON planify_permission_sets(org_id);
CREATE INDEX idx_planify_permission_sets_plan ON planify_permission_sets(plan_id);
CREATE INDEX idx_planify_permission_sets_system ON planify_permission_sets(is_system) WHERE is_system = TRUE;
CREATE INDEX idx_planify_plan_members_plan ON planify_plan_members(plan_id);
CREATE INDEX idx_planify_plan_members_profile ON planify_plan_members(profile_id);
CREATE INDEX idx_planify_plan_members_permission_set ON planify_plan_members(permission_set_id);
CREATE INDEX idx_planify_categories_org ON planify_categories(org_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE planify_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_permission_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_plan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_categories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PERMISSION CHECKING FUNCTIONS
-- =====================================================

-- Function to check if user has a specific permission in a plan
CREATE OR REPLACE FUNCTION has_plan_permission(
  p_plan_id UUID,
  p_user_id UUID,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_permissions TEXT[];
  v_is_owner BOOLEAN;
BEGIN
  -- Get member's permission set and owner status
  SELECT ps.permissions, pm.is_owner
  INTO v_permissions, v_is_owner
  FROM planify_plan_members pm
  JOIN planify_permission_sets ps ON ps.id = pm.permission_set_id
  WHERE pm.plan_id = p_plan_id
  AND pm.profile_id = p_user_id
  AND pm.status = 'active';

  -- Not a member
  IF v_permissions IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Owner always has full access
  IF v_is_owner THEN
    RETURN TRUE;
  END IF;

  -- Check direct permission
  IF p_permission = ANY(v_permissions) THEN
    RETURN TRUE;
  END IF;

  -- Check wildcard (e.g., "activity.*" matches "activity.create")
  IF (split_part(p_permission, '.', 1) || '.*') = ANY(v_permissions) THEN
    RETURN TRUE;
  END IF;

  -- Check full wildcard
  IF '*' = ANY(v_permissions) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user can manage permissions (owner or org admin role_id >= 3)
CREATE OR REPLACE FUNCTION can_manage_plan_permissions(
  p_plan_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_org_id UUID;
  v_is_owner BOOLEAN;
  v_org_role_id INTEGER;
BEGIN
  -- Check if plan owner
  SELECT pm.is_owner INTO v_is_owner
  FROM planify_plan_members pm
  WHERE pm.plan_id = p_plan_id
  AND pm.profile_id = p_user_id
  AND pm.status = 'active';

  IF v_is_owner THEN
    RETURN TRUE;
  END IF;

  -- Check if org admin (role_id >= 3)
  SELECT p.org_id INTO v_org_id
  FROM planify_plans p
  WHERE p.id = p_plan_id;

  SELECT ou.role_id INTO v_org_role_id
  FROM org_user ou
  WHERE ou.org_id = v_org_id
  AND ou.profile_id = p_user_id;

  IF v_org_role_id >= 3 THEN
    RETURN TRUE;
  END IF;

  -- Check via permission set
  RETURN has_plan_permission(p_plan_id, p_user_id, 'plan.manage_permissions');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- RLS POLICIES - PERMISSION SETS
-- =====================================================

-- Everyone can read system permission sets
CREATE POLICY "Anyone can read system permission sets"
  ON planify_permission_sets FOR SELECT
  TO authenticated
  USING (is_system = TRUE);

-- Plan members can read permission sets for their plans
CREATE POLICY "Plan members can read plan permission sets"
  ON planify_permission_sets FOR SELECT
  TO authenticated
  USING (
    plan_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM planify_plan_members pm
      WHERE pm.plan_id = planify_permission_sets.plan_id
      AND pm.profile_id = auth.uid()
      AND pm.status = 'active'
    )
  );

-- Org staff can read org-level permission sets
CREATE POLICY "Org staff can read org permission sets"
  ON planify_permission_sets FOR SELECT
  TO authenticated
  USING (
    org_id IS NOT NULL AND plan_id IS NULL AND
    EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_permission_sets.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 1
    )
  );

-- Permission managers can create custom permission sets
CREATE POLICY "Permission managers can insert custom sets"
  ON planify_permission_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    is_system = FALSE AND
    (
      (plan_id IS NOT NULL AND can_manage_plan_permissions(plan_id, auth.uid()))
      OR
      (org_id IS NOT NULL AND plan_id IS NULL AND EXISTS (
        SELECT 1 FROM org_user
        WHERE org_user.org_id = planify_permission_sets.org_id
        AND org_user.profile_id = auth.uid()
        AND org_user.role_id >= 3
      ))
    )
  );

-- Permission managers can update custom permission sets
CREATE POLICY "Permission managers can update custom sets"
  ON planify_permission_sets FOR UPDATE
  TO authenticated
  USING (
    is_system = FALSE AND
    (
      (plan_id IS NOT NULL AND can_manage_plan_permissions(plan_id, auth.uid()))
      OR
      (org_id IS NOT NULL AND plan_id IS NULL AND EXISTS (
        SELECT 1 FROM org_user
        WHERE org_user.org_id = planify_permission_sets.org_id
        AND org_user.profile_id = auth.uid()
        AND org_user.role_id >= 3
      ))
    )
  );

-- Permission managers can delete custom permission sets
CREATE POLICY "Permission managers can delete custom sets"
  ON planify_permission_sets FOR DELETE
  TO authenticated
  USING (
    is_system = FALSE AND
    (
      (plan_id IS NOT NULL AND can_manage_plan_permissions(plan_id, auth.uid()))
      OR
      (org_id IS NOT NULL AND plan_id IS NULL AND EXISTS (
        SELECT 1 FROM org_user
        WHERE org_user.org_id = planify_permission_sets.org_id
        AND org_user.profile_id = auth.uid()
        AND org_user.role_id >= 3
      ))
    )
  );

-- =====================================================
-- RLS POLICIES - PLANS
-- =====================================================

-- Plan members can read plans
CREATE POLICY "Plan members can read plans"
  ON planify_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM planify_plan_members pm
      WHERE pm.plan_id = planify_plans.id
      AND pm.profile_id = auth.uid()
      AND pm.status = 'active'
    )
  );

-- Staff can create plans in their org
CREATE POLICY "Staff can create plans"
  ON planify_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_plans.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 1
    )
  );

-- Users with plan.edit permission can update plans
CREATE POLICY "Users with plan.edit can update plans"
  ON planify_plans FOR UPDATE
  TO authenticated
  USING (has_plan_permission(id, auth.uid(), 'plan.edit'));

-- Users with plan.delete permission can delete plans
CREATE POLICY "Users with plan.delete can delete plans"
  ON planify_plans FOR DELETE
  TO authenticated
  USING (has_plan_permission(id, auth.uid(), 'plan.delete'));

-- =====================================================
-- RLS POLICIES - PLAN MEMBERS
-- =====================================================

-- Members can read other members of plans they belong to
CREATE POLICY "Members can read plan members"
  ON planify_plan_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM planify_plan_members pm
      WHERE pm.plan_id = planify_plan_members.plan_id
      AND pm.profile_id = auth.uid()
      AND pm.status = 'active'
    )
  );

-- Users with plan.manage_members can insert members
CREATE POLICY "Permission holders can insert members"
  ON planify_plan_members FOR INSERT
  TO authenticated
  WITH CHECK (
    has_plan_permission(plan_id, auth.uid(), 'plan.manage_members')
    OR can_manage_plan_permissions(plan_id, auth.uid())
  );

-- Users with plan.manage_members can update members
CREATE POLICY "Permission holders can update members"
  ON planify_plan_members FOR UPDATE
  TO authenticated
  USING (
    has_plan_permission(plan_id, auth.uid(), 'plan.manage_members')
    OR can_manage_plan_permissions(plan_id, auth.uid())
  );

-- Users with plan.manage_members can delete members (except owner)
CREATE POLICY "Permission holders can delete members"
  ON planify_plan_members FOR DELETE
  TO authenticated
  USING (
    is_owner = FALSE AND (
      has_plan_permission(plan_id, auth.uid(), 'plan.manage_members')
      OR can_manage_plan_permissions(plan_id, auth.uid())
    )
  );

-- =====================================================
-- RLS POLICIES - CATEGORIES
-- =====================================================

-- Everyone can read default categories
CREATE POLICY "Anyone can read default categories"
  ON planify_categories FOR SELECT
  TO authenticated
  USING (is_default = TRUE);

-- Org staff can read their org's categories
CREATE POLICY "Org staff can read org categories"
  ON planify_categories FOR SELECT
  TO authenticated
  USING (
    org_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_categories.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 1
    )
  );

-- Org admins can manage categories
CREATE POLICY "Org admins can manage categories"
  ON planify_categories FOR ALL
  TO authenticated
  USING (
    is_default = FALSE AND
    EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_categories.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 3
    )
  );

-- =====================================================
-- SEED SYSTEM DEFAULT PERMISSION SETS
-- =====================================================

-- Full Access
INSERT INTO planify_permission_sets (
  name, name_sv, description, is_system, is_guest, permissions, restrictions
) VALUES (
  'Full Access',
  'Full åtkomst',
  'Complete control over the plan (except ownership transfer)',
  TRUE,
  FALSE,
  ARRAY[
    'activity.create', 'activity.view_own', 'activity.view_all',
    'activity.edit_own', 'activity.edit_all', 'activity.delete_own',
    'activity.delete_all', 'activity.publish', 'activity.unpublish',
    'activity.duplicate',
    'plan.view', 'plan.edit', 'plan.manage_members',
    'plan.manage_sharing', 'plan.manage_permissions',
    'template.view', 'template.create', 'template.edit_own',
    'template.edit_all', 'template.delete_own', 'template.delete_all',
    'template.use',
    'schedule.view_own', 'schedule.view_team', 'schedule.edit_own',
    'schedule.edit_team', 'schedule.request_timeoff', 'schedule.approve_timeoff',
    'assignment.view', 'assignment.assign_self', 'assignment.assign_others',
    'assignment.remove_self', 'assignment.remove_others',
    'sync.view_status', 'sync.trigger', 'sync.resolve_conflicts'
  ],
  '{}'::JSONB
);

-- Manager
INSERT INTO planify_permission_sets (
  name, name_sv, description, is_system, is_guest, permissions, restrictions
) VALUES (
  'Manager',
  'Ansvarig',
  'Can manage activities and members, publish to Noisify',
  TRUE,
  FALSE,
  ARRAY[
    'activity.create', 'activity.view_all', 'activity.edit_all',
    'activity.delete_all', 'activity.publish', 'activity.unpublish',
    'activity.duplicate',
    'plan.view', 'plan.edit', 'plan.manage_members', 'plan.manage_sharing',
    'template.view', 'template.create', 'template.edit_own',
    'template.edit_all', 'template.delete_own', 'template.delete_all',
    'template.use',
    'schedule.view_own', 'schedule.view_team', 'schedule.edit_own',
    'schedule.approve_timeoff',
    'assignment.view', 'assignment.assign_self', 'assignment.assign_others',
    'assignment.remove_self', 'assignment.remove_others',
    'sync.view_status', 'sync.trigger', 'sync.resolve_conflicts'
  ],
  '{}'::JSONB
);

-- Contributor
INSERT INTO planify_permission_sets (
  name, name_sv, description, is_system, is_guest, permissions, restrictions
) VALUES (
  'Contributor',
  'Bidragsgivare',
  'Can create and edit own activities, view all',
  TRUE,
  FALSE,
  ARRAY[
    'activity.create', 'activity.view_all', 'activity.edit_own',
    'activity.delete_own', 'activity.duplicate',
    'plan.view',
    'template.view', 'template.create', 'template.edit_own',
    'template.delete_own', 'template.use',
    'schedule.view_own', 'schedule.view_team', 'schedule.edit_own',
    'schedule.request_timeoff',
    'assignment.view', 'assignment.assign_self', 'assignment.remove_self',
    'sync.view_status'
  ],
  '{}'::JSONB
);

-- Viewer
INSERT INTO planify_permission_sets (
  name, name_sv, description, is_system, is_guest, permissions, restrictions
) VALUES (
  'Viewer',
  'Visare',
  'Read-only access to plan and activities',
  TRUE,
  FALSE,
  ARRAY[
    'activity.view_all',
    'plan.view',
    'template.view',
    'schedule.view_own',
    'assignment.view',
    'sync.view_status'
  ],
  '{}'::JSONB
);

-- Guest
INSERT INTO planify_permission_sets (
  name, name_sv, description, is_system, is_guest, permissions, restrictions
) VALUES (
  'Guest',
  'Gäst',
  'Limited view access for external users (no sensitive data)',
  TRUE,
  TRUE,
  ARRAY[
    'activity.view_all',
    'plan.view'
  ],
  '{"hide_contact_info": true, "hide_internal_notes": true, "hide_assignments": true, "limited_ui": true}'::JSONB
);

-- =====================================================
-- SEED DEFAULT CATEGORIES
-- =====================================================

INSERT INTO planify_categories (name, color, is_default, sort_order) VALUES
  ('Dans', '#F59E0B', TRUE, 1),
  ('Mat', '#F97316', TRUE, 2),
  ('Öppen Fritidsgård', '#10B981', TRUE, 3),
  ('Sport/Motion', '#14B8A6', TRUE, 4),
  ('Spel/e-sport', '#8B5CF6', TRUE, 5),
  ('Event', '#EC4899', TRUE, 6);

-- =====================================================
-- HELPER FUNCTION: Get user's permission set for a plan
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_plan_permissions(
  p_plan_id UUID,
  p_user_id UUID
) RETURNS TABLE (
  permissions TEXT[],
  is_owner BOOLEAN,
  restrictions JSONB,
  permission_set_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.permissions,
    pm.is_owner,
    ps.restrictions,
    ps.name
  FROM planify_plan_members pm
  JOIN planify_permission_sets ps ON ps.id = pm.permission_set_id
  WHERE pm.plan_id = p_plan_id
  AND pm.profile_id = p_user_id
  AND pm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_planify_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER planify_plans_updated_at
  BEFORE UPDATE ON planify_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_planify_updated_at();

CREATE TRIGGER planify_permission_sets_updated_at
  BEFORE UPDATE ON planify_permission_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_planify_updated_at();
