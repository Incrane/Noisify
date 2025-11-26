export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            activity: {
                Row: {
                    activity_type: Database["public"]["Enums"]["activity_type"]
                    address: string | null
                    age_max: number | null
                    age_min: number | null
                    capacity: number
                    city_id: string | null
                    created_at: string
                    created_by: string
                    description: string | null
                    edit_group_id: string | null
                    ends_at: string
                    id: string
                    image_url: string | null
                    name: string
                    owner_org_id: string
                    registration_deadline: string | null
                    registration_rules: Database["public"]["Enums"]["registration_rules"]
                    reserve_capacity: number
                    rrule: string | null
                    slug: string | null
                    starts_at: string
                    status: Database["public"]["Enums"]["activity_status"]
                    type: string | null
                    updated_at: string
                    visibility: Database["public"]["Enums"]["visibility"]
                }
                Insert: {
                    activity_type?: Database["public"]["Enums"]["activity_type"]
                    address?: string | null
                    age_max?: number | null
                    age_min?: number | null
                    capacity?: number
                    city_id?: string | null
                    created_at?: string
                    created_by: string
                    description?: string | null
                    edit_group_id?: string | null
                    ends_at: string
                    id?: string
                    image_url?: string | null
                    name: string
                    owner_org_id: string
                    registration_deadline?: string | null
                    registration_rules?: Database["public"]["Enums"]["registration_rules"]
                    reserve_capacity?: number
                    rrule?: string | null
                    slug?: string | null
                    starts_at: string
                    status?: Database["public"]["Enums"]["activity_status"]
                    type?: string | null
                    updated_at?: string
                    visibility?: Database["public"]["Enums"]["visibility"]
                }
                Update: {
                    activity_type?: Database["public"]["Enums"]["activity_type"]
                    address?: string | null
                    age_max?: number | null
                    age_min?: number | null
                    capacity?: number
                    city_id?: string | null
                    created_at?: string
                    created_by?: string
                    description?: string | null
                    edit_group_id?: string | null
                    ends_at?: string
                    id?: string
                    image_url?: string | null
                    name?: string
                    owner_org_id?: string
                    registration_deadline?: string | null
                    registration_rules?: Database["public"]["Enums"]["registration_rules"]
                    reserve_capacity?: number
                    rrule?: string | null
                    slug?: string | null
                    starts_at?: string
                    status?: Database["public"]["Enums"]["activity_status"]
                    type?: string | null
                    updated_at?: string
                    visibility?: Database["public"]["Enums"]["visibility"]
                }
                Relationships: [
                    {
                        foreignKeyName: "activity_city_id_fkey"
                        columns: ["city_id"]
                        isOneToOne: false
                        referencedRelation: "cities"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activity_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activity_owner_org_id_fkey"
                        columns: ["owner_org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            activity_categories: {
                Row: {
                    activity_id: string
                    category_id: string
                    created_at: string
                }
                Insert: {
                    activity_id: string
                    category_id: string
                    created_at?: string
                }
                Update: {
                    activity_id?: string
                    category_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "activity_categories_activity_id_fkey"
                        columns: ["activity_id"]
                        isOneToOne: false
                        referencedRelation: "activity"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activity_categories_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                ]
            }
            activity_favorites: {
                Row: {
                    activity_id: string
                    created_at: string
                    id: string
                    profile_id: string
                }
                Insert: {
                    activity_id: string
                    created_at?: string
                    id?: string
                    profile_id: string
                }
                Update: {
                    activity_id?: string
                    created_at?: string
                    id?: string
                    profile_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "activity_favorites_activity_id_fkey"
                        columns: ["activity_id"]
                        isOneToOne: false
                        referencedRelation: "activity"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activity_favorites_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            activity_target_subgroups: {
                Row: {
                    activity_id: string
                    created_at: string
                    sub_group_id: string
                }
                Insert: {
                    activity_id: string
                    created_at?: string
                    sub_group_id: string
                }
                Update: {
                    activity_id?: string
                    created_at?: string
                    sub_group_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "activity_target_subgroups_activity_id_fkey"
                        columns: ["activity_id"]
                        isOneToOne: false
                        referencedRelation: "activity"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activity_target_subgroups_sub_group_id_fkey"
                        columns: ["sub_group_id"]
                        isOneToOne: false
                        referencedRelation: "target_subgroups"
                        referencedColumns: ["id"]
                    },
                ]
            }
            categories: {
                Row: {
                    cat_name: string
                    created_at: string
                    id: string
                }
                Insert: {
                    cat_name: string
                    created_at?: string
                    id?: string
                }
                Update: {
                    cat_name?: string
                    created_at?: string
                    id?: string
                }
                Relationships: []
            }
            chat_groups: {
                Row: {
                    created_at: string
                    created_by: string
                    id: string
                    is_active: boolean
                    name: string | null
                    org_id: string
                }
                Insert: {
                    created_at?: string
                    created_by: string
                    id?: string
                    is_active?: boolean
                    name?: string | null
                    org_id: string
                }
                Update: {
                    created_at?: string
                    created_by?: string
                    id?: string
                    is_active?: boolean
                    name?: string | null
                    org_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_groups_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "chat_groups_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            chat_messages: {
                Row: {
                    content: string
                    created_at: string
                    group_id: string
                    id: string
                    sender_id: string
                }
                Insert: {
                    content: string
                    created_at?: string
                    group_id: string
                    id?: string
                    sender_id: string
                }
                Update: {
                    content?: string
                    created_at?: string
                    group_id?: string
                    id?: string
                    sender_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_messages_group_id_fkey"
                        columns: ["group_id"]
                        isOneToOne: false
                        referencedRelation: "chat_groups"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "chat_messages_sender_id_fkey"
                        columns: ["sender_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            chat_participants: {
                Row: {
                    group_id: string
                    id: string
                    is_blocked: boolean
                    joined_at: string
                    profile_id: string
                    role: Database["public"]["Enums"]["chat_participant_role"]
                }
                Insert: {
                    group_id: string
                    id?: string
                    is_blocked?: boolean
                    joined_at?: string
                    profile_id: string
                    role?: Database["public"]["Enums"]["chat_participant_role"]
                }
                Update: {
                    group_id?: string
                    id?: string
                    is_blocked?: boolean
                    joined_at?: string
                    profile_id?: string
                    role?: Database["public"]["Enums"]["chat_participant_role"]
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_participants_group_id_fkey"
                        columns: ["group_id"]
                        isOneToOne: false
                        referencedRelation: "chat_groups"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "chat_participants_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            cities: {
                Row: {
                    city: string
                    created_at: string
                    id: string
                }
                Insert: {
                    city: string
                    created_at?: string
                    id?: string
                }
                Update: {
                    city?: string
                    created_at?: string
                    id?: string
                }
                Relationships: []
            }
            course_enrollments: {
                Row: {
                    completed_at: string | null
                    course_id: string
                    created_at: string
                    enrolled_at: string
                    id: string
                    profile_id: string
                    status: Database["public"]["Enums"]["enrollment_status"]
                    updated_at: string
                }
                Insert: {
                    completed_at?: string | null
                    course_id: string
                    created_at?: string
                    enrolled_at?: string
                    id?: string
                    profile_id: string
                    status?: Database["public"]["Enums"]["enrollment_status"]
                    updated_at?: string
                }
                Update: {
                    completed_at?: string | null
                    course_id?: string
                    created_at?: string
                    enrolled_at?: string
                    id?: string
                    profile_id?: string
                    status?: Database["public"]["Enums"]["enrollment_status"]
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "course_enrollments_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "course_enrollments_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            course_favorites: {
                Row: {
                    course_id: string
                    created_at: string
                    id: string
                    profile_id: string
                }
                Insert: {
                    course_id: string
                    created_at?: string
                    id?: string
                    profile_id: string
                }
                Update: {
                    course_id?: string
                    created_at?: string
                    id?: string
                    profile_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "course_favorites_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "course_favorites_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            course_lessons: {
                Row: {
                    content: string | null
                    created_at: string
                    description: string | null
                    duration_minutes: number | null
                    id: string
                    module_id: string
                    order_index: number
                    title: string
                    updated_at: string
                    video_url: string | null
                }
                Insert: {
                    content?: string | null
                    created_at?: string
                    description?: string | null
                    duration_minutes?: number | null
                    id?: string
                    module_id: string
                    order_index: number
                    title: string
                    updated_at?: string
                    video_url?: string | null
                }
                Update: {
                    content?: string | null
                    created_at?: string
                    description?: string | null
                    duration_minutes?: number | null
                    id?: string
                    module_id?: string
                    order_index?: number
                    title?: string
                    updated_at?: string
                    video_url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "course_lessons_module_id_fkey"
                        columns: ["module_id"]
                        isOneToOne: false
                        referencedRelation: "course_modules"
                        referencedColumns: ["id"]
                    },
                ]
            }
            course_modules: {
                Row: {
                    course_id: string
                    created_at: string
                    description: string | null
                    id: string
                    order_index: number
                    title: string
                    updated_at: string
                }
                Insert: {
                    course_id: string
                    created_at?: string
                    description?: string | null
                    id?: string
                    order_index: number
                    title: string
                    updated_at?: string
                }
                Update: {
                    course_id?: string
                    created_at?: string
                    description?: string | null
                    id?: string
                    order_index?: number
                    title?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "course_modules_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                ]
            }
            course_progress: {
                Row: {
                    completed_at: string | null
                    created_at: string
                    enrollment_id: string
                    id: string
                    last_accessed_at: string
                    lesson_id: string
                    status: Database["public"]["Enums"]["lesson_status"]
                    updated_at: string
                }
                Insert: {
                    completed_at?: string | null
                    created_at?: string
                    enrollment_id: string
                    id?: string
                    last_accessed_at?: string
                    lesson_id: string
                    status?: Database["public"]["Enums"]["lesson_status"]
                    updated_at?: string
                }
                Update: {
                    completed_at?: string | null
                    created_at?: string
                    enrollment_id?: string
                    id?: string
                    last_accessed_at?: string
                    lesson_id?: string
                    status?: Database["public"]["Enums"]["lesson_status"]
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "course_progress_enrollment_id_fkey"
                        columns: ["enrollment_id"]
                        isOneToOne: false
                        referencedRelation: "course_enrollments"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "course_progress_lesson_id_fkey"
                        columns: ["lesson_id"]
                        isOneToOne: false
                        referencedRelation: "course_lessons"
                        referencedColumns: ["id"]
                    },
                ]
            }
            course_tags: {
                Row: {
                    course_id: string
                    created_at: string
                    tag_id: string
                }
                Insert: {
                    course_id: string
                    created_at?: string
                    tag_id: string
                }
                Update: {
                    course_id?: string
                    created_at?: string
                    tag_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "course_tags_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "course_tags_tag_id_fkey"
                        columns: ["tag_id"]
                        isOneToOne: false
                        referencedRelation: "tags"
                        referencedColumns: ["id"]
                    },
                ]
            }
            courses: {
                Row: {
                    access_level: Database["public"]["Enums"]["course_access_level"]
                    created_at: string
                    created_by: string
                    description: string | null
                    id: string
                    image_url: string | null
                    name: string
                    owner_org_id: string
                    slug: string
                    status: Database["public"]["Enums"]["course_status"]
                    updated_at: string
                }
                Insert: {
                    access_level?: Database["public"]["Enums"]["course_access_level"]
                    created_at?: string
                    created_by: string
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    name: string
                    owner_org_id: string
                    slug: string
                    status?: Database["public"]["Enums"]["course_status"]
                    updated_at?: string
                }
                Update: {
                    access_level?: Database["public"]["Enums"]["course_access_level"]
                    created_at?: string
                    created_by?: string
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    name?: string
                    owner_org_id?: string
                    slug?: string
                    status?: Database["public"]["Enums"]["course_status"]
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "courses_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "courses_owner_org_id_fkey"
                        columns: ["owner_org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            memberships: {
                Row: {
                    created_at: string
                    end_date: string | null
                    id: string
                    membership_state: Database["public"]["Enums"]["membership_state"]
                    org_id: string
                    profile_id: string
                    start_date: string
                    state_changed_at: string
                    state_reason: string | null
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    end_date?: string | null
                    id?: string
                    membership_state?: Database["public"]["Enums"]["membership_state"]
                    org_id: string
                    profile_id: string
                    start_date?: string
                    state_changed_at?: string
                    state_reason?: string | null
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    end_date?: string | null
                    id?: string
                    membership_state?: Database["public"]["Enums"]["membership_state"]
                    org_id?: string
                    profile_id?: string
                    start_date?: string
                    state_changed_at?: string
                    state_reason?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "memberships_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "memberships_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    activity_id: string | null
                    assigned_user_id: string
                    course_id: string | null
                    created_at: string
                    id: string
                    is_read: boolean
                    link_url: string | null
                    message: string | null
                    org_id: string | null
                    related_user_id: string | null
                    title: string
                    type: Database["public"]["Enums"]["notification_type"]
                }
                Insert: {
                    activity_id?: string | null
                    assigned_user_id: string
                    course_id?: string | null
                    created_at?: string
                    id?: string
                    is_read?: boolean
                    link_url?: string | null
                    message?: string | null
                    org_id?: string | null
                    related_user_id?: string | null
                    title: string
                    type: Database["public"]["Enums"]["notification_type"]
                }
                Update: {
                    activity_id?: string | null
                    assigned_user_id?: string
                    course_id?: string | null
                    created_at?: string
                    id?: string
                    is_read?: boolean
                    link_url?: string | null
                    message?: string | null
                    org_id?: string | null
                    related_user_id?: string | null
                    title?: string
                    type?: Database["public"]["Enums"]["notification_type"]
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_activity_id_fkey"
                        columns: ["activity_id"]
                        isOneToOne: false
                        referencedRelation: "activity"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "notifications_assigned_user_id_fkey"
                        columns: ["assigned_user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "notifications_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "notifications_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "notifications_related_user_id_fkey"
                        columns: ["related_user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            org_membership_types: {
                Row: {
                    created_at: string
                    description: string | null
                    id: string
                    is_default: boolean
                    name: string
                    org_id: string
                    price: number
                    requires_approval: boolean
                    target_subgroups: string[] | null
                    validity_days: number | null
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    is_default?: boolean
                    name: string
                    org_id: string
                    price?: number
                    requires_approval?: boolean
                    target_subgroups?: string[] | null
                    validity_days?: number | null
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    is_default?: boolean
                    name?: string
                    org_id?: string
                    price?: number
                    requires_approval?: boolean
                    target_subgroups?: string[] | null
                    validity_days?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "org_membership_types_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            org_user: {
                Row: {
                    created_at: string
                    id: string
                    joined_at: string
                    org_id: string
                    profile_id: string
                    role_id: number
                    status: Database["public"]["Enums"]["personal_status"]
                }
                Insert: {
                    created_at?: string
                    id?: string
                    joined_at?: string
                    org_id: string
                    profile_id: string
                    role_id?: number
                    status?: Database["public"]["Enums"]["personal_status"]
                }
                Update: {
                    created_at?: string
                    id?: string
                    joined_at?: string
                    org_id?: string
                    profile_id?: string
                    role_id?: number
                    status?: Database["public"]["Enums"]["personal_status"]
                }
                Relationships: [
                    {
                        foreignKeyName: "org_user_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "org_user_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "org_user_role_id_fkey"
                        columns: ["role_id"]
                        isOneToOne: false
                        referencedRelation: "role"
                        referencedColumns: ["id"]
                    },
                ]
            }
            organization_favorites: {
                Row: {
                    created_at: string
                    id: string
                    org_id: string
                    profile_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    org_id: string
                    profile_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    org_id?: string
                    profile_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "organization_favorites_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "organization_favorites_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            organizations: {
                Row: {
                    adress: string | null
                    city_id: string | null
                    created_at: string
                    id: string
                    kontakt: string | null
                    logo_url: string | null
                    max_members: number
                    max_staff: number
                    max_storage_mb: number
                    org_description: string | null
                    org_namn: string
                    org_status: Database["public"]["Enums"]["org_status"]
                    owner_id: string | null
                    tier: Database["public"]["Enums"]["pricing_tier"]
                    updated_at: string
                }
                Insert: {
                    adress?: string | null
                    city_id?: string | null
                    created_at?: string
                    id?: string
                    kontakt?: string | null
                    logo_url?: string | null
                    max_members?: number
                    max_staff?: number
                    max_storage_mb?: number
                    org_description?: string | null
                    org_namn: string
                    org_status?: Database["public"]["Enums"]["org_status"]
                    owner_id?: string | null
                    tier?: Database["public"]["Enums"]["pricing_tier"]
                    updated_at?: string
                }
                Update: {
                    adress?: string | null
                    city_id?: string | null
                    created_at?: string
                    id?: string
                    kontakt?: string | null
                    logo_url?: string | null
                    max_members?: number
                    max_staff?: number
                    max_storage_mb?: number
                    org_description?: string | null
                    org_namn?: string
                    org_status?: Database["public"]["Enums"]["org_status"]
                    owner_id?: string | null
                    tier?: Database["public"]["Enums"]["pricing_tier"]
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "organizations_city_id_fkey"
                        columns: ["city_id"]
                        isOneToOne: false
                        referencedRelation: "cities"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    alias: string
                    avatar_url: string | null
                    created_at: string
                    fodd_ar: number | null
                    id: string
                    target_subgroup: string | null
                    updated_at: string
                    user_id: string | null
                }
                Insert: {
                    alias: string
                    avatar_url?: string | null
                    created_at?: string
                    fodd_ar?: number | null
                    id?: string
                    target_subgroup?: string | null
                    updated_at?: string
                    user_id?: string | null
                }
                Update: {
                    alias?: string
                    avatar_url?: string | null
                    created_at?: string
                    fodd_ar?: number | null
                    id?: string
                    target_subgroup?: string | null
                    updated_at?: string
                    user_id?: string | null
                }
                Relationships: []
            }
            registration: {
                Row: {
                    activity_id: string
                    created_at: string
                    id: string
                    notes: string | null
                    profile_id: string
                    registration_date: string
                    status: Database["public"]["Enums"]["registration_status"]
                    updated_at: string
                }
                Insert: {
                    activity_id: string
                    created_at?: string
                    id?: string
                    notes?: string | null
                    profile_id: string
                    registration_date?: string
                    status?: Database["public"]["Enums"]["registration_status"]
                    updated_at?: string
                }
                Update: {
                    activity_id?: string
                    created_at?: string
                    id?: string
                    notes?: string | null
                    profile_id?: string
                    registration_date?: string
                    status?: Database["public"]["Enums"]["registration_status"]
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "registration_activity_id_fkey"
                        columns: ["activity_id"]
                        isOneToOne: false
                        referencedRelation: "activity"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "registration_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            role: {
                Row: {
                    created_at: string
                    id: number
                    role_name: string
                }
                Insert: {
                    created_at?: string
                    id?: number
                    role_name: string
                }
                Update: {
                    created_at?: string
                    id?: number
                    role_name?: string
                }
                Relationships: []
            }
            room_booking_attendees: {
                Row: {
                    booking_id: string
                    created_at: string
                    id: string
                    profile_id: string
                    status: string
                }
                Insert: {
                    booking_id: string
                    created_at?: string
                    id?: string
                    profile_id: string
                    status?: string
                }
                Update: {
                    booking_id?: string
                    created_at?: string
                    id?: string
                    profile_id?: string
                    status?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "room_booking_attendees_booking_id_fkey"
                        columns: ["booking_id"]
                        isOneToOne: false
                        referencedRelation: "room_bookings"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "room_booking_attendees_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            room_bookings: {
                Row: {
                    admin_notes: string | null
                    booking_date: string
                    created_at: string
                    end_time: string
                    id: string
                    org_id: string
                    profile_id: string
                    purpose: string | null
                    rejection_reason: string | null
                    room_id: string
                    start_time: string
                    status: Database["public"]["Enums"]["room_booking_status"]
                    title: string
                    updated_at: string
                }
                Insert: {
                    admin_notes?: string | null
                    booking_date: string
                    created_at?: string
                    end_time: string
                    id?: string
                    org_id: string
                    profile_id: string
                    purpose?: string | null
                    rejection_reason?: string | null
                    room_id: string
                    start_time: string
                    status?: Database["public"]["Enums"]["room_booking_status"]
                    title: string
                    updated_at?: string
                }
                Update: {
                    admin_notes?: string | null
                    booking_date?: string
                    created_at?: string
                    end_time?: string
                    id?: string
                    org_id?: string
                    profile_id?: string
                    purpose?: string | null
                    rejection_reason?: string | null
                    room_id?: string
                    start_time?: string
                    status?: Database["public"]["Enums"]["room_booking_status"]
                    title?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "room_bookings_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "room_bookings_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "room_bookings_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                ]
            }
            room_images: {
                Row: {
                    created_at: string
                    display_order: number
                    id: string
                    image_url: string
                    room_id: string
                }
                Insert: {
                    created_at?: string
                    display_order?: number
                    id?: string
                    image_url: string
                    room_id: string
                }
                Update: {
                    created_at?: string
                    display_order?: number
                    id?: string
                    image_url?: string
                    room_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "room_images_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                ]
            }
            room_perks: {
                Row: {
                    created_at: string
                    id: string
                    perk_id: string
                    room_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    perk_id: string
                    room_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    perk_id?: string
                    room_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "room_perks_perk_id_fkey"
                        columns: ["perk_id"]
                        isOneToOne: false
                        referencedRelation: "user_perks"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "room_perks_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                ]
            }
            room_time_slots: {
                Row: {
                    allowed_subgroups: string[] | null
                    created_at: string
                    day_of_week: number
                    end_time: string
                    id: string
                    is_active: boolean
                    room_id: string
                    start_time: string
                }
                Insert: {
                    allowed_subgroups?: string[] | null
                    created_at?: string
                    day_of_week: number
                    end_time: string
                    id?: string
                    is_active?: boolean
                    room_id: string
                    start_time: string
                }
                Update: {
                    allowed_subgroups?: string[] | null
                    created_at?: string
                    day_of_week?: number
                    end_time?: string
                    id?: string
                    is_active?: boolean
                    room_id?: string
                    start_time?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "room_time_slots_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                ]
            }
            rooms: {
                Row: {
                    amenities: Database["public"]["Enums"]["amenity_type"][] | null
                    booking_rule: Database["public"]["Enums"]["booking_rule"]
                    capacity: number
                    created_at: string
                    description: string | null
                    id: string
                    is_bookable: boolean
                    location_description: string | null
                    name: string
                    org_id: string
                    requires_approval: boolean
                    room_type: Database["public"]["Enums"]["room_type"]
                    status: Database["public"]["Enums"]["room_status"]
                    updated_at: string
                }
                Insert: {
                    amenities?: Database["public"]["Enums"]["amenity_type"][] | null
                    booking_rule?: Database["public"]["Enums"]["booking_rule"]
                    capacity: number
                    created_at?: string
                    description?: string | null
                    id?: string
                    is_bookable?: boolean
                    location_description?: string | null
                    name: string
                    org_id: string
                    requires_approval?: boolean
                    room_type?: Database["public"]["Enums"]["room_type"]
                    status?: Database["public"]["Enums"]["room_status"]
                    updated_at?: string
                }
                Update: {
                    amenities?: Database["public"]["Enums"]["amenity_type"][] | null
                    booking_rule?: Database["public"]["Enums"]["booking_rule"]
                    capacity?: number
                    created_at?: string
                    description?: string | null
                    id?: string
                    is_bookable?: boolean
                    location_description?: string | null
                    name?: string
                    org_id?: string
                    requires_approval?: boolean
                    room_type?: Database["public"]["Enums"]["room_type"]
                    status?: Database["public"]["Enums"]["room_status"]
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "rooms_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tags: {
                Row: {
                    created_at: string
                    id: string
                    name: string
                    usage_count: number
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                    usage_count?: number
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                    usage_count?: number
                }
                Relationships: []
            }
            target_subgroups: {
                Row: {
                    created_at: string
                    id: string
                    name: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                }
                Relationships: []
            }
            temp_test_users: {
                Row: {
                    created_at: string
                    email: string
                    id: number
                    password: string
                    role: string
                }
                Insert: {
                    created_at?: string
                    email: string
                    id?: number
                    password: string
                    role: string
                }
                Update: {
                    created_at?: string
                    email?: string
                    id?: number
                    password?: string
                    role?: string
                }
                Relationships: []
            }
            user_interests: {
                Row: {
                    category_id: string
                    created_at: string
                    id: string
                    profile_id: string
                }
                Insert: {
                    category_id: string
                    created_at?: string
                    id?: string
                    profile_id: string
                }
                Update: {
                    category_id?: string
                    created_at?: string
                    id?: string
                    profile_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_interests_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_interests_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_perks: {
                Row: {
                    category: Database["public"]["Enums"]["perk_category"]
                    created_at: string
                    description: string | null
                    expires_at: string | null
                    grant_condition: Database["public"]["Enums"]["perk_grant_condition"]
                    granted_at: string
                    id: string
                    name: string
                    org_id: string
                    profile_id: string
                    status: Database["public"]["Enums"]["perk_status"]
                    updated_at: string
                }
                Insert: {
                    category: Database["public"]["Enums"]["perk_category"]
                    created_at?: string
                    description?: string | null
                    expires_at?: string | null
                    grant_condition: Database["public"]["Enums"]["perk_grant_condition"]
                    granted_at?: string
                    id?: string
                    name: string
                    org_id: string
                    profile_id: string
                    status?: Database["public"]["Enums"]["perk_status"]
                    updated_at?: string
                }
                Update: {
                    category?: Database["public"]["Enums"]["perk_category"]
                    created_at?: string
                    description?: string | null
                    expires_at?: string | null
                    grant_condition?: Database["public"]["Enums"]["perk_grant_condition"]
                    granted_at?: string
                    id?: string
                    name?: string
                    org_id?: string
                    profile_id?: string
                    status?: Database["public"]["Enums"]["perk_status"]
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_perks_org_id_fkey"
                        columns: ["org_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_perks_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_settings: {
                Row: {
                    created_at: string
                    id: string
                    key: string
                    updated_at: string
                    user_id: string
                    value: Json
                }
                Insert: {
                    created_at?: string
                    id?: string
                    key: string
                    updated_at?: string
                    user_id: string
                    value: Json
                }
                Update: {
                    created_at?: string
                    id?: string
                    key?: string
                    updated_at?: string
                    user_id?: string
                    value?: Json
                }
                Relationships: []
            }
            users_private: {
                Row: {
                    created_at: string
                    email: string | null
                    id: string
                    phone: string | null
                    updated_at: string
                    user_id: string | null
                }
                Insert: {
                    created_at?: string
                    email?: string | null
                    id?: string
                    phone?: string | null
                    updated_at?: string
                    user_id?: string | null
                }
                Update: {
                    created_at?: string
                    email?: string | null
                    id?: string
                    phone?: string | null
                    updated_at?: string
                    user_id?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            add_instructor_to_course: {
                Args: {
                    p_course_id: string
                    p_instructor_id: string
                    p_is_primary?: boolean
                    p_sort_order?: number
                }
                Returns: string
            }
            add_tag_to_course: {
                Args: {
                    p_course_id: string
                    p_tag_name: string
                }
                Returns: string
            }
            can_user_book_room: {
                Args: {
                    room_uuid: string
                }
                Returns: boolean
            }
            can_user_book_room_at_time: {
                Args: {
                    room_uuid: string
                    booking_time: string
                }
                Returns: boolean
            }
            cancel_registration: {
                Args: {
                    p_registration_id: string
                }
                Returns: Json
            }
            check_alias_availability: {
                Args: {
                    p_alias: string
                }
                Returns: Json
            }
            create_bulk_activities: {
                Args: {
                    p_name: string
                    p_description: string
                    p_owner_org_id: string
                    p_created_by: string
                    p_activity_type: Database["public"]["Enums"]["activity_type"]
                    p_registration_rules: Database["public"]["Enums"]["registration_rules"]
                    p_visibility: Database["public"]["Enums"]["visibility"]
                    p_capacity: number
                    p_reserve_capacity: number
                    p_age_min: number
                    p_age_max: number
                    p_start_date: string
                    p_end_date: string
                    p_start_time: string
                    p_end_time: string
                    p_repeat_days: number[]
                    p_category_ids: string[]
                    p_subgroup_ids: string[]
                    p_image_url: string
                    p_address: string
                    p_city_id: string
                    p_contact_person_ids: string[]
                    p_registration_deadline: string
                }
                Returns: Json
            }
            create_notification: {
                Args: {
                    p_assigned_user_id: string
                    p_type: Database["public"]["Enums"]["notification_type"]
                    p_title: string
                    p_message?: string
                    p_link_url?: string
                    p_related_user_id?: string
                    p_activity_id?: string
                    p_course_id?: string
                    p_org_id?: string
                    p_created_at?: string
                    p_is_read?: boolean
                }
                Returns: string
            }
            create_or_update_course: {
                Args: {
                    p_name: string
                    p_owner_org_id: string
                    p_created_by: string
                    p_description?: string
                    p_image_url?: string
                    p_access_level?: Database["public"]["Enums"]["course_access_level"]
                    p_status?: Database["public"]["Enums"]["course_status"]
                    p_tag_names?: string[]
                    p_tag_ids?: string[]
                    p_instructors?: Json
                    p_modules?: Json
                    p_course_id?: string
                }
                Returns: Json
            }
            get_available_tags: {
                Args: Record<PropertyKey, never>
                Returns: {
                    id: string
                    name: string
                    usage_count: number
                }[]
            }
            get_my_profile_id: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            get_or_create_instructor_from_profile: {
                Args: {
                    p_profile_id: string
                }
                Returns: string
            }
            get_unread_notification_count: {
                Args: Record<PropertyKey, never>
                Returns: number
            }
            has_registration_time_conflict: {
                Args: {
                    p_profile_id: string
                    p_starts_at: string
                    p_ends_at: string
                    p_exclude_activity_id?: string
                }
                Returns: boolean
            }
            has_room_booking_conflict: {
                Args: {
                    room_uuid: string
                    start_time: string
                    end_time: string
                    exclude_booking_id?: string
                }
                Returns: boolean
            }
            is_activity_org_staff: {
                Args: {
                    p_activity_id: string
                }
                Returns: boolean
            }
            is_eligible_member: {
                Args: {
                    p_org_id: string
                    p_profile_id: string
                }
                Returns: boolean
            }
            is_org_staff: {
                Args: {
                    p_org_id: string
                }
                Returns: boolean
            }
            is_registration_open: {
                Args: {
                    p_activity_id: string
                }
                Returns: boolean
            }
            mark_all_notifications_as_read: {
                Args: Record<PropertyKey, never>
                Returns: number
            }
            mark_notification_as_read: {
                Args: {
                    p_notification_id: string
                }
                Returns: boolean
            }
            register_for_activity: {
                Args: {
                    p_activity_id: string
                }
                Returns: Json
            }
            respond_to_invitation: {
                Args: {
                    p_registration_id: string
                    p_accept: boolean
                }
                Returns: Json
            }
            signup_member: {
                Args: {
                    p_user_id: string
                    p_email: string
                    p_alias: string
                    p_fodd_ar: number
                }
                Returns: Json
            }
            toggle_favorite: {
                Args: {
                    p_item_id: string
                    p_item_type: string
                }
                Returns: boolean
            }
            upsert_user_interests: {
                Args: {
                    p_category_ids: string[]
                }
                Returns: {
                    category_id: string
                    created_at: string
                    id: string
                    profile_id: string
                }[]
            }
        }
        Enums: {
            activity_status: ["DRAFT", "PUBLISHED", "ARCHIVED"]
            activity_type: ["NORMAL", "RANDOM"]
            amenity_type: [
                "PROJECTOR",
                "WHITEBOARD",
                "SOUND_SYSTEM",
                "PIANO",
                "DRUMS",
                "GUITAR_AMP",
                "BASS_AMP",
                "MICROPHONE",
                "KITCHENETTE",
                "MIRRORS",
                "YOGA_MATS",
                "TABLES_CHAIRS",
                "COMPUTER",
                "PRINTER",
                "GAMING_CONSOLE",
                "VR_HEADSET",
                "SEWING_MACHINE",
                "POTTERY_WHEEL",
                "EASELS",
                "OTHER",
            ]
            booking_rule: [
                "OPEN_FOR_ALL",
                "MEMBERS_ONLY",
                "REQUIRES_PERK",
                "STAFF_ONLY",
            ]
            chat_participant_role: ["admin", "member"]
            course_access_level: [
                "OPEN_FOR_ALL",
                "ONLY_MEMBERS",
                "SELECTED_MEMBERS",
            ]
            course_status: ["DRAFT", "PUBLISHED", "ARCHIVED"]
            enrollment_status: ["ENROLLED", "IN_PROGRESS", "COMPLETED", "DROPPED"]
            lesson_status: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]
            membership_state: [
                "active",
                "pending",
                "expired",
                "cancelled",
                "suspended",
                "suspended_due_to_policy",
                "unknown",
                "awaiting_visit",
                "rejected",
            ]
            notification_type: [
                "registration_accepted",
                "registration_rejected",
                "registration_invited",
                "registration_waitlisted",
                "activity_deadline_soon",
                "activity_reminder",
                "activity_cancelled",
                "membership_approved",
                "membership_expiring",
                "membership_expired",
                "room_booking_approved",
                "room_booking_rejected",
                "course_enrolled",
                "course_completed",
                "perk_granted",
                "system_announcement",
            ]
            org_status: [
                "pending",
                "public",
                "draft",
                "active",
                "inactive",
                "suspended",
            ]
            perk_category: ["ROOM_ACCESS", "DISCOUNT", "PRIORITY_BOOKING", "OTHER"]
            perk_grant_condition: ["ON_REGISTRATION", "ON_APPROVAL", "ON_COMPLETION"]
            perk_status: ["ACTIVE", "EXPIRED", "REVOKED"]
            personal_status: [
                "aktiv",
                "inbjuden",
                "ansökt",
                "nekad",
                "onboarding",
                "inaktiv",
            ]
            pricing_tier: ["FREE", "PRO", "ENTERPRISE"]
            registration_rules: ["OPEN_FOR_ALL", "ONLY_MEMBERS", "SELECTED_MEMBERS"]
            registration_status: [
                "PENDING",
                "ACCEPTED",
                "REJECTED",
                "WAITLISTED",
                "LOTTERY_REJECTED",
                "INVITED",
            ]
            room_booking_status: [
                "PENDING",
                "APPROVED",
                "REJECTED",
                "CANCELLED",
                "COMPLETED",
            ],
            room_status: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
            room_type: [
                "MEETING_ROOM",
                "STUDIO",
                "WORKSHOP_SPACE",
                "CREATIVE_LAB",
                "OTHER",
            ],
            visibility: ["PUBLIC", "PRIVATE"]
        }
    }
}
