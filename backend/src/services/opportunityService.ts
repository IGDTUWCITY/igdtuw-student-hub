import { supabaseAdmin } from './supabase';
import { FetchedOpportunity } from '../fetchers/gemini';
import crypto from 'crypto';

function buildStableExternalId(
  title: string,
  organization: string | null | undefined,
  opportunityType: string
): string {
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedOrg = (organization || '').trim().toLowerCase();
  const normalizedType = opportunityType.trim().toLowerCase();
  const raw = `${normalizedTitle}|${normalizedOrg}|${normalizedType}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return `igdtuw-${hash.slice(0, 16)}`;
}

/**
 * Save opportunities to Supabase database
 * Handles duplicate detection using external_id
 * @param opportunities - Array of opportunities fetched from Gemini
 * @returns Object with saved count and skipped count
 */
export async function saveOpportunitiesToDatabase(
  opportunities: FetchedOpportunity[]
): Promise<{ saved: number; skipped: number; errors: number }> {
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`\n📦 Processing ${opportunities.length} opportunities...`);

  for (const opp of opportunities) {
    try {
      const normalizedDeadline =
        !opp.deadline || opp.deadline.toLowerCase() === 'not specified'
          ? null
          : opp.deadline;

      const normalizedIsRemote = typeof opp.is_remote === 'boolean'
        ? opp.is_remote
        : String(opp.is_remote).toLowerCase() === 'true';

      const normalizedSkills = Array.isArray(opp.required_skills)
        ? opp.required_skills
        : typeof opp.required_skills === 'string'
          ? (opp.required_skills as string)
              .split(',')
              .map((skill: string) => skill.trim())
              .filter(Boolean)
          : [];

      const normalizedLocation = opp.location && opp.location !== 'Not specified'
        ? opp.location
        : 'Online';

      const normalizedStipend = opp.stipend && opp.stipend !== 'Not specified'
        ? opp.stipend
        : null;

      const normalizedApplyLink = opp.apply_link && opp.apply_link !== 'Not specified'
        ? opp.apply_link
        : null;

      const stableExternalId = buildStableExternalId(
        opp.title,
        opp.organization,
        opp.opportunity_type
      );

      // Check if opportunity already exists (using external_id)
      const { data: existing } = await supabaseAdmin
        .from('opportunities')
        .select('id')
        .eq('external_id', stableExternalId)
        .single();

      if (existing) {
        console.log(`⏭️  Skipping duplicate: ${opp.title}`);
        skipped++;
        continue;
      }

      // Additional duplicate check (title + organization match)
      const normalizedTitle = opp.title.trim();
      const normalizedOrg = opp.organization?.trim();

      let duplicateQuery = supabaseAdmin
        .from('opportunities')
        .select('id')
        .ilike('title', normalizedTitle);

      if (normalizedOrg) {
        duplicateQuery = duplicateQuery.ilike('organization', normalizedOrg);
      }

      const { data: titleMatch } = await duplicateQuery.maybeSingle();

      if (titleMatch) {
        console.log(`⏭️  Skipping duplicate by title/org: ${opp.title}`);
        skipped++;
        continue;
      }

      // Insert new opportunity
      const { error } = await supabaseAdmin.from('opportunities').insert({
        title: opp.title,
        organization: opp.organization,
        description: opp.description,
        opportunity_type: opp.opportunity_type,
        deadline: normalizedDeadline,
        location: normalizedLocation,
        is_remote: normalizedIsRemote,
        stipend: normalizedStipend,
        required_skills: normalizedSkills,
        apply_link: normalizedApplyLink,
        external_id: stableExternalId,
      });

      if (error) {
        console.error(`❌ Error saving "${opp.title}":`, error.message);
        errors++;
      } else {
        console.log(`✅ Saved: ${opp.title}`);
        saved++;
      }
    } catch (error) {
      console.error(`❌ Exception while processing "${opp.title}":`, error);
      errors++;
    }
  }

  console.log(`\n📊 Summary: ${saved} saved, ${skipped} skipped, ${errors} errors\n`);

  return { saved, skipped, errors };
}

/**
 * Get the last sync timestamp from database
 * Useful for tracking when opportunities were last fetched
 */
export async function getLastSyncTime(): Promise<Date | null> {
  const { data } = await supabaseAdmin
    .from('opportunities')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data ? new Date(data.created_at) : null;
}

/**
 * Delete opportunities older than 7 days (based on fetch/listed date)
 * Keeps database clean by removing stale opportunities
 */
export async function cleanupExpiredOpportunities(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);

  const { data, error } = await supabaseAdmin
    .from('opportunities')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    console.error('❌ Error cleaning up expired opportunities:', error);
    return 0;
  }

  const deletedCount = data?.length || 0;
  if (deletedCount > 0) {
    console.log(`🗑️  Cleaned up ${deletedCount} expired opportunities`);
  }

  return deletedCount;
}
