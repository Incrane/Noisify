-- =====================================================
-- PLANIFY ACTIVITIES - Phase 2
-- Activities table and related functionality
-- =====================================================

-- =====================================================
-- ACTIVITIES TABLE
-- =====================================================

CREATE TABLE p_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES p_plans(id) ON DELETE CASCADE,

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,

  -- Category
  category_id UUID REFERENCES p_categories(id) ON DELETE SET NULL,

  -- Scheduling
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,

  -- Location
  location TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'published')),

  -- Sync with Noisify
  noisify_activity_id UUID, -- Reference to published activity in Noisify
  synced_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_p_activities_plan ON p_activities(plan_id);
CREATE INDEX idx_p_activities_category ON p_activities(category_id);
CREATE INDEX idx_p_activities_start_time ON p_activities(start_time);
CREATE INDEX idx_p_activities_created_by ON p_activities(created_by);
CREATE INDEX idx_p_activities_status ON p_activities(status);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE p_activities ENABLE ROW LEVEL SECURITY;

-- Plan members can read activities if they have activity.view_all or activity.view_own permission
CREATE POLICY "Plan members can read activities"
  ON p_activities FOR SELECT
  TO authenticated
  USING (
    has_plan_permission(plan_id, auth.uid(), 'activity.view_all')
    OR (
      has_plan_permission(plan_id, auth.uid(), 'activity.view_own')
      AND created_by = auth.uid()
    )
  );

-- Users with activity.create permission can insert activities
CREATE POLICY "Users with permission can create activities"
  ON p_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    has_plan_permission(plan_id, auth.uid(), 'activity.create')
  );

-- Users with activity.edit_all or activity.edit_own can update activities
CREATE POLICY "Users with permission can update activities"
  ON p_activities FOR UPDATE
  TO authenticated
  USING (
    has_plan_permission(plan_id, auth.uid(), 'activity.edit_all')
    OR (
      has_plan_permission(plan_id, auth.uid(), 'activity.edit_own')
      AND created_by = auth.uid()
    )
  );

-- Users with activity.delete_all or activity.delete_own can delete activities
CREATE POLICY "Users with permission can delete activities"
  ON p_activities FOR DELETE
  TO authenticated
  USING (
    has_plan_permission(plan_id, auth.uid(), 'activity.delete_all')
    OR (
      has_plan_permission(plan_id, auth.uid(), 'activity.delete_own')
      AND created_by = auth.uid()
    )
  );

-- =====================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =====================================================

CREATE TRIGGER p_activities_updated_at
  BEFORE UPDATE ON p_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_p_updated_at();
