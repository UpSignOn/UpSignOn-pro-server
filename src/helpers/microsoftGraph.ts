import { ClientSecretCredential } from '@azure/identity';
import { Client, ClientOptions } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { db } from './db';

// Necessary permissions are listed here
// Création de l'application: App Registrations > New
//   - choisir le scope qui correspond aux personnes qui auront le droit d'utiliser upsignon
//   - pas de redirect URL
// API Permissions > Microsoft Graph > Application Permission
// - Directory.Read.All
// OR
// - User.ReadBasic.All
// - GroupMember.Read.All
// -
// Puis Grant Admin consent for Default Directory
// Then create an appRole that allows users to have a PRO vault:
//   - Description : Can create an UpSignOn PRO vault

// GRAPH EXPLORER
// https://developer.microsoft.com/en-us/graph/graph-explorer

// SYNTAX DOC: https://learn.microsoft.com/en-us/graph/filter-query-parameter?tabs=http
// THROTTLING LIMITS: https://learn.microsoft.com/en-us/graph/throttling-limits

// NB Active Directory package: https://www.npmjs.com/package/activedirectory2

type EntraConfig = {
  tenantId: string | null;
  clientId: string | null;
  clientSecret: string | null;
  appResourceId: string | null;
};
type EntraGroup = {
  id: string;
  displayName: string;
};
export class MicrosoftGraph {
  static _instances: { [groupId: number]: _MicrosoftGraph } = {};
  static _groupConfig: { [groupId: number]: EntraConfig | null } = {};

  static async isUserAuthorizedForUpSignOn(groupId: number, userEmail: string): Promise<boolean> {
    const graph = await MicrosoftGraph._getInstance(groupId);
    if (graph) {
      const isAuthorized = await graph.isUserAuthorizedForUpSignOn(userEmail);
      return isAuthorized;
    }
    return false;
  }


  static async _getInstance(groupId: number): Promise<_MicrosoftGraph | null> {
    const entraConfigRes = await db.query('SELECT ms_entra_config FROM groups WHERE id=$1', [
      groupId,
    ]);
    const entraConfig: EntraConfig | null = entraConfigRes.rows[0]?.ms_entra_config || null;
    if (
      !MicrosoftGraph._instances[groupId] ||
      MicrosoftGraph._hasConfigChanged(groupId, entraConfig)
    ) {
      if (
        entraConfig?.tenantId &&
        entraConfig.clientId &&
        entraConfig.clientSecret &&
        entraConfig.appResourceId
      ) {
        MicrosoftGraph._instances[groupId] = new _MicrosoftGraph(
          entraConfig.tenantId,
          entraConfig.clientId,
          entraConfig.clientSecret,
          entraConfig.appResourceId,
        );
      } else {
        delete MicrosoftGraph._instances[groupId];
      }
      MicrosoftGraph._groupConfig[groupId] = entraConfig;
    }
    return MicrosoftGraph._instances[groupId] || null;
  }

  static _hasConfigChanged(groupId: number, currentConfig: EntraConfig | null): boolean {
    const cachedConfig = MicrosoftGraph._groupConfig[groupId];
    if (currentConfig == null && cachedConfig == null) return false;
    if (
      currentConfig?.tenantId != cachedConfig?.tenantId ||
      currentConfig?.clientId != cachedConfig?.clientId ||
      currentConfig?.clientSecret != cachedConfig?.clientSecret ||
      currentConfig?.appResourceId != cachedConfig?.appResourceId
    ) {
      return true;
    }
    return false;
  }
}

class _MicrosoftGraph {
  msGraph: Client;
  appResourceId: string;

  /**
   *
   * @param tenantId - The Microsoft Entra tenant (directory) ID.
   * @param clientId - The client (application) ID of an App Registration in the tenant.
   * @param clientSecret - A client secret that was generated for the App Registration.
   * @param appResourceId - Identifier of the ressource (UpSignOn) in the graph that users need to have access to in order to be authorized to use an UpSignOn licence
   */
  constructor(tenantId: string, clientId: string, clientSecret: string, appResourceId: string) {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      // The client credentials flow requires that you request the
      // /.default scope, and pre-configure your permissions on the
      // app registration in Azure. An administrator must grant consent
      // to those permissions beforehand.
      scopes: ['https://graph.microsoft.com/.default'],
    });

    const clientOptions: ClientOptions = {
      authProvider,
    };
    this.msGraph = Client.initWithMiddleware(clientOptions);
    this.appResourceId = appResourceId;
  }

  /**
   * Gets the id of the first user to match that email address and who has been assigned the role for using UpSignOn
   *
   * @param email
   * @returns the id if such a user exists, null otherwise
   */
  async _getUserIdFromEmail(email: string): Promise<string | null> {
    if (!email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      throw 'Email is malformed';
    }

    // PERMISSION = User.ReadBasic.All
    const users = await this.msGraph
      .api('/users')
      .header('ConsistencyLevel', 'eventual')
      .filter(`mail eq '${email}' or otherMails/any(oe:oe eq '${email}')`)
      .select(['id'])
      .get();
    const userId = users.value[0]?.id;
    return userId;
  }

  async isUserAuthorizedForUpSignOn(email: string): Promise<boolean> {
    const userId = await this._getUserIdFromEmail(email);
    if (!userId) return false;

    // PERMISSION = AppRoleAssignment.ReadWrite.All ou Directory.Read.All
    const appRoleAssignments = await this.msGraph
      .api(`/users/${userId}/appRoleAssignments`)
      .header('ConsistencyLevel', 'eventual')
      .filter(`resourceId eq ${this.appResourceId}`)
      .get();
    return appRoleAssignments.value.length > 0;
  }
}
