import { EntraConfig, MicrosoftGraph } from 'ms-entra-for-upsignon';
import { db } from './db';

export const setupMSGraph = () => {
  MicrosoftGraph.getMSEntraConfigForGroup = async (
    groupId: number,
  ): Promise<EntraConfig | null> => {
    const entraConfigRes = await db.query('SELECT ms_entra_config FROM groups WHERE id=$1', [
      groupId,
    ]);
    const entraConfig: EntraConfig | null = entraConfigRes.rows[0]?.ms_entra_config || null;
    return entraConfig;
  };
};
