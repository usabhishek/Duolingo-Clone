# API Overview

Base URL: `/api/v1`

## Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Login (form: username=email, password) |
| GET | /auth/me | Current user profile + stats |
| GET | /auth/oauth/google/status | Check if OAuth enabled |

## Courses & Path
| GET | /courses | List all language courses |
| GET | /path?course_id= | Learning path with lock states |
| POST | /users/active-course | Switch Spanish/German/English |

## Lessons
| POST | /lessons/{id}/attempts | Start lesson |
| POST | /lesson-attempts/{id}/answer | Submit answer |
| POST | /lesson-attempts/{id}/complete | Complete lesson, earn rewards |

## Gamification
| GET | /stats | XP, hearts, streak, daily goal |
| POST | /hearts/refill | Spend gems for hearts |

## Social
| GET/POST | /friends/* | Friend requests, accept, activity |
| WS | /ws/chat?token= | Real-time chat |

## Learning Analytics
| GET | /recommendations | Personalized skill recommendation |
| GET | /mistakes | Mistake journal |
| GET | /analytics | Full learner analytics |
| GET | /analytics/learning-health | 0-100 health score |
| POST | /practice/personalized | Weak-area practice (max 5 XP) |
| POST | /legendary/{skill_id}/start | Legendary challenge |

## Leaderboard & Achievements
| GET | /leaderboard | Ranked by real total_xp |
| GET | /achievements | All achievements with unlock status |

OpenAPI docs: http://localhost:8000/docs
