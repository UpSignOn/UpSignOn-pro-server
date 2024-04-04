import { db } from '../../helpers/db';
import { MicrosoftGraph } from '../../helpers/microsoftGraph';

type TEmailAuthorizationStatus = 'UNAUTHORIZED' | 'PATTERN_AUTHORIZED' | 'MS_ENTRA_AUTHORIZED';

export const getEmailAuthorizationStatus = async (
  userEmail: string,
  groupId: number,
): Promise<TEmailAuthorizationStatus> => {
  // CHECK EMAIL PATTERNS
  const patternRes = await db.query('SELECT pattern FROM allowed_emails WHERE group_id=$1', [
    groupId,
  ]);
  const isAuthorizedByPattern = patternRes.rows.some((emailPattern) => {
    if (emailPattern.pattern.indexOf('*@') === 0) {
      return userEmail.split('@')[1] === emailPattern.pattern.replace('*@', '');
    } else {
      return userEmail === emailPattern.pattern;
    }
  });

  if (isAuthorizedByPattern) return 'PATTERN_AUTHORIZED';

  // CHECK MICROSOFT ENTRA
  try {
    const isEntraAuthorized = await MicrosoftGraph.isUserAuthorizedForUpSignOn(groupId, userEmail);
    if (isEntraAuthorized) return 'MS_ENTRA_AUTHORIZED';
  } catch (e) {
    console.error(e);
  }

  return 'UNAUTHORIZED';
};
