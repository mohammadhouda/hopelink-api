const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

/**
 * Compute a numeric match score between an opportunity and a volunteer's profile.
 * Higher = better match. Score is always >= 0.
 *
 * Scoring weights:
 *   +2 per required skill that matches a volunteer skill
 *   +1 per volunteer skill found in title/description (only when requiredSkills is empty)
 *   +3 per overlapping availability day
 *   +1 start-day fallback (when opportunity has no availabilityDays)
 *   +3 if charity category matches a CATEGORY preference
 *   +2 per city preference that matches the opportunity location
 */
export function scoreOpportunity(opp, volunteerSkills, volunteerDays, preferences) {
  let score = 0;

  // Skill match
  for (const skill of opp.requiredSkills) {
    if (volunteerSkills.some((s) => s.toLowerCase() === skill.toLowerCase())) score += 2;
  }

  // Fuzzy fallback when no requiredSkills are set
  if (opp.requiredSkills.length === 0) {
    const text = `${opp.title} ${opp.description}`.toLowerCase();
    for (const skill of volunteerSkills) {
      if (text.includes(skill.toLowerCase())) score += 1;
    }
  }

  // Availability day match
  for (const day of opp.availabilityDays) {
    if (volunteerDays.includes(day)) score += 3;
  }

  // Start-day fallback when opportunity has no availabilityDays
  if (opp.availabilityDays.length === 0 && opp.startDate && volunteerDays.length > 0) {
    const dayName = DAYS[new Date(opp.startDate).getDay()];
    if (volunteerDays.includes(dayName)) score += 1;
  }

  // Preference matches
  for (const pref of preferences) {
    if (pref.type === "CATEGORY" && opp.charity?.category === pref.value) score += 3;
    if (pref.type === "CITY" && opp.location?.toLowerCase().includes(pref.value.toLowerCase())) score += 2;
  }

  return score;
}
