# DONE_J - M3 Speaking Readaloud Question Bank

## Completed Files

| File | Items | Description |
|------|-------|-------------|
| `data/speaking_readaloud_G1.json` | 25 | G1 single sentences, common vocabulary |
| `data/speaking_readaloud_G2.json` | 25 | G2 2-3 sentence short passages |
| `data/speaking_readaloud_G3.json` | 25 | G3 longer passages with challenging pronunciation |

## Structure

Each item follows the M3 speaking schema:
```json
{
  "id": "SR-G{grade}-{NNN}",
  "grade": "G1|G2|G3",
  "section": "speaking",
  "type": "readaloud",
  "level_tag": ["tag1", "tag2"],
  "source": "static",
  "text": "English passage to read aloud",
  "tips": ["pronunciation tip 1", "intonation tip 2", "..."],
  "explanation": "Traditional Chinese explanation"
}
```

## Tags Coverage

- **G1**: greetings, self-intro, school, hobbies, weather, ordering, location, time, family, invitation, reading, feelings, directions, ability, shopping, schedule, nature, talent, subject, appearance, homework, plans, pets
- **G2**: daily routine, weather/plans, describing people, restaurant, health, weekend, directions, music/hobby, shopping, school subjects, festivals, sports, travel, technology, pets, food, seasons, parties, learning, community, transportation, environment, movies, dreams, doctor visit
- **G3**: travel, environment, technology, culture/festivals, inspiration, health, fables, self-growth, nature/Taiwan, career, animals/science, history (Great Wall), friendship, water/science, volunteering, AI, life philosophy, bubble tea, reading value, mental health, Internet, space, time management, Halloween, perseverance

## Notes

- ID format: `SR-{grade}-{NNN}` (3-digit sequential)
- `text` field contains the English content students will read aloud
- `tips` array contains pronunciation/intonation guidance in Traditional Chinese
- `explanation` field contains key teaching points in Traditional Chinese
- Designed for Web Speech API (en-US) demo + MediaRecorder self-assessment
