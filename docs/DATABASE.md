# Database Schema

## Entity Hierarchy
```
Course → Unit → Skill → Lesson → Exercise
User → UserSkillProgress → Skill
User → LessonAttempt → ExerciseAttempt
User → UserStats (1:1)
User → UserAchievement → Achievement
User → Friendship, ChatMessage, MistakeRecord
```

## Key Tables

### users
- id, email (unique), username (unique), hashed_password, display_name, avatar_url, active_course_id

### courses / units / skills / lessons / exercises
- Hierarchical content with order constraints
- exercises.payload (JSON) stores options AND correct answers (never sent to client pre-submit)

### user_stats (authoritative gamification)
- total_xp, gems, hearts, streak, daily_xp_goal, today_xp, lessons_completed

### user_skill_progress
- crown_level (0-5), state (locked/available/completed), lessons_completed

### lesson_attempts / exercise_attempts
- Full audit trail of every lesson session and answer

### mistake_records
- Unique (user_id, exercise_id) — mistake_count, last_mistake_at

### friendships / chat_messages / friend_activities
- Social features with status enum

## Indexes
- Foreign keys on all relationships
- Unique constraints on email, username, user+skill, user+achievement, user+exercise mistake

## Cascade
- ON DELETE CASCADE from users and course hierarchy
